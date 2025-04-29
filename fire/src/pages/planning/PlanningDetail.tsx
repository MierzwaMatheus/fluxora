import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/lib/data";
import { Navbar } from "@/components/ui/navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewTransactionDialog } from "@/components/planning/NewTransactionDialog";
import { formatCategory } from "@/lib/categories";
import { TransactionFilters, SortField, SortOrder } from "@/components/planning/TransactionFilters";

const PlanningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category_id: string;
    is_paid: boolean;
    observation?: string | null;
  } | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    description: "",
    amount: "",
    type: "expense" as const,
    categoryId: "",
    is_paid: false,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showPaidOnly, setShowPaidOnly] = useState(false);

  const { data: list, isLoading, error } = useQuery({
    queryKey: ['planning-list', id],
    queryFn: async () => {
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        console.error('ID inválido:', id);
        throw new Error('ID inválido');
      }

      const { data, error } = await supabase
        .from('planning_lists')
        .select(`
          *,
          planning_transactions (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar lista:', error);
        throw error;
      }
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-inter font-semibold mb-4">Erro ao carregar planejamento</h2>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar os dados deste planejamento. O ID fornecido pode ser inválido.
          </p>
          <Button 
            onClick={() => navigate("/planning")}
            className="bg-fluxora-purple hover:bg-fluxora-purple/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista
          </Button>
        </div>
      </div>
    );
  }

  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('planning_transactions')
        .insert([{
          list_id: id,
          user_id: user?.id,
          description: transactionForm.description,
          amount: Number(transactionForm.amount),
          type: transactionForm.type,
          category_id: transactionForm.categoryId,
          is_paid: transactionForm.is_paid,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-list', id] });
      setIsDialogOpen(false);
      setTransactionForm({
        description: "",
        amount: "",
        type: "expense",
        categoryId: "",
        is_paid: false,
      });
      toast({
        title: "Transação criada",
        description: "Sua transação foi criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a transação. Tente novamente.",
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('planning_transactions')
        .delete()
        .eq('id', transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-list', id] });
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso!",
      });
    }
  });

  const togglePaidStatusMutation = useMutation({
    mutationFn: async ({ transactionId, isPaid }: { transactionId: string; isPaid: boolean }) => {
      const { error } = await supabase
        .from('planning_transactions')
        .update({ is_paid: isPaid })
        .eq('id', transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-list', id] });
    }
  });

  if (isLoading || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-fluxora-purple rounded-full animate-spin mx-auto mb-2"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const transactions = list.planning_transactions || [];

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const balance = income - expense;
  const isPositive = balance >= 0;

  const filteredTransactions = transactions
    .filter(transaction => {
      // Filtro por tipo (aba)
      if (activeTab !== "all" && activeTab !== transaction.type) {
        if (activeTab === "pending" && (!transaction.is_paid || transaction.type !== "expense")) {
          return false;
        }
        return false;
      }

      // Filtro por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!transaction.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por categoria
      if (selectedCategory && transaction.category_id !== selectedCategory) {
        return false;
      }

      // Filtro por status de pagamento
      if (showPaidOnly && !transaction.is_paid) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case "amount":
          comparison = b.amount - a.amount;
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-6">
        <div className="container">
          <button 
            onClick={() => navigate("/planning")}
            className="flex items-center text-gray-300 hover:text-white mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm font-roboto">Voltar</span>
          </button>
          <h1 className="text-2xl font-inter font-semibold">{list.name}</h1>
        </div>
      </header>

      <main className="container mt-6">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-4'} mb-6`}>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-inter font-semibold text-fluxora-green">
              R$ {income.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-lg font-inter font-semibold text-fluxora-red">
              R$ {expense.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-inter font-semibold ${isPositive ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={`flex flex-col ${isMobile ? 'space-y-4' : 'flex-row items-center justify-between'} mb-4`}>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className={`w-full ${isMobile ? 'max-w-full' : 'max-w-md'}`}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expense">Despesas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TransactionFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortField={sortField}
                onSortFieldChange={setSortField}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                showPaidOnly={showPaidOnly}
                onPaidOnlyChange={setShowPaidOnly}
              />
            </div>
          </Tabs>

          <Button 
            onClick={() => setIsDialogOpen(true)}
            className={`bg-fluxora-purple hover:bg-fluxora-purple/90 ${isMobile ? 'w-full' : ''}`}
          >
            <Plus className="h-5 w-5 mr-1" /> Nova
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y">
              {filteredTransactions.map(transaction => {
                const isIncome = transaction.type === 'income';
                
                return (
                  <div key={transaction.id} className={`p-4 ${isMobile ? 'flex flex-col space-y-2' : 'flex items-center justify-between'} group`}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isIncome ? (
                          <TrendingUp className="h-5 w-5 text-fluxora-green" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-fluxora-red" />
                        )}
                      </div>
                      <div>
                        <p className="font-inter font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground font-roboto">
                          {formatCategory(transaction.category_id) || 'Sem categoria'} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        {transaction.observation && (
                          <p className="text-xs italic text-muted-foreground mt-1">
                            {transaction.observation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`${isMobile ? 'flex justify-between items-center ml-10' : 'flex items-center space-x-4'}`}>
                      <p className={`font-inter font-semibold ${isIncome ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
                        {isIncome ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
                      </p>
                      {transaction.type === 'expense' && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={transaction.is_paid}
                            onCheckedChange={(checked) => 
                              togglePaidStatusMutation.mutate({ 
                                transactionId: transaction.id, 
                                isPaid: checked 
                              })
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {transaction.is_paid ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsDialogOpen(true);
                          }}
                          className={`p-2 rounded-full hover:bg-blue-50 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                          className={`p-2 rounded-full hover:bg-red-50 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-roboto">
                Nenhuma transação encontrada
              </p>
            </div>
          )}
        </div>
      </main>
      
      <NewTransactionDialog
        listId={id}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction || undefined}
      />

      <Navbar />
    </div>
  );
};

export default PlanningDetail;
