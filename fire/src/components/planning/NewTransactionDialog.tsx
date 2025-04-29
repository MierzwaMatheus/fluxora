import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Constants } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CATEGORIES, formatCategory, getTransactionCategoryOptions } from "@/lib/categories";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { cn } from "@/lib/utils";

interface NewTransactionDialogProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category_id: string;
    is_paid: boolean;
    observation?: string | null;
  };
}

export function NewTransactionDialog({ listId, isOpen, onClose, editingTransaction }: NewTransactionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [transactionForm, setTransactionForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category_id: "",
    is_paid: false,
    observation: "",
  });

  // Update form when editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      setTransactionForm({
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString(),
        type: editingTransaction.type,
        category_id: editingTransaction.category_id,
        is_paid: editingTransaction.is_paid,
        observation: editingTransaction.observation || "",
      });
    } else {
      setTransactionForm({
        description: "",
        amount: "",
        type: "expense",
        category_id: "",
        is_paid: false,
        observation: "",
      });
    }
  }, [editingTransaction]);

  // Update categories based on type
  const categories = transactionForm.type === 'income'
    ? Object.entries(CATEGORIES.income)
    : Object.entries(CATEGORIES.expense);

  // Fetch last transaction with same description (only when not editing)
  const { data: lastTransaction } = useQuery({
    queryKey: ['last-transaction', transactionForm.description],
    queryFn: async () => {
      if (!transactionForm.description) return null;

      const { data, error } = await supabase
        .from('planning_transactions')
        .select('*')
        .eq('description', transactionForm.description)
        .eq('type', transactionForm.type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!transactionForm.description && !editingTransaction
  });

  // Effect to auto-fill amount from last transaction (only when not editing)
  useEffect(() => {
    if (lastTransaction && !editingTransaction) {
      setTransactionForm(prev => ({
        ...prev,
        amount: lastTransaction.amount.toString(),
        category_id: lastTransaction.category_id,
      }));
    }
  }, [lastTransaction, editingTransaction]);

  const createOrUpdateTransactionMutation = useMutation({
    mutationFn: async () => {
      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('planning_transactions')
          .update({
            description: transactionForm.description,
            amount: Number(transactionForm.amount),
            type: transactionForm.type,
            category_id: transactionForm.category_id,
            is_paid: transactionForm.is_paid,
            observation: transactionForm.observation || null,
          })
          .eq('id', editingTransaction.id)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('planning_transactions')
          .insert([{
            list_id: listId,
            user_id: user?.id,
            description: transactionForm.description,
            amount: Number(transactionForm.amount),
            type: transactionForm.type,
            category_id: transactionForm.category_id,
            is_paid: transactionForm.is_paid,
            observation: transactionForm.observation || null,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-list', listId] });
      onClose();
      setTransactionForm({
        description: "",
        amount: "",
        type: "expense",
        category_id: "",
        is_paid: false,
        observation: "",
      });
      toast({
        title: editingTransaction ? "Transação atualizada" : "Transação criada",
        description: editingTransaction 
          ? "Sua transação foi atualizada com sucesso!"
          : "Sua transação foi criada com sucesso!",
      });
    }
  });

  const handleSubmit = () => {
    if (!transactionForm.description || !transactionForm.amount || !transactionForm.category_id) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    createOrUpdateTransactionMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-inter">
            {editingTransaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-roboto">Descrição</label>
            <Input 
              value={transactionForm.description} 
              onChange={(e) => setTransactionForm(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="Ex: Salário, Aluguel, Mercado"
              className="font-roboto"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-roboto">Valor (R$)</label>
            <Input 
              type="number"
              value={transactionForm.amount} 
              onChange={(e) => setTransactionForm(prev => ({
                ...prev,
                amount: e.target.value
              }))}
              placeholder="0.00"
              className="font-roboto"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-roboto">Tipo</label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={transactionForm.type === "expense" ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  transactionForm.type === "expense" && "bg-fluxora-purple hover:bg-fluxora-purple/90"
                )}
                onClick={() => setTransactionForm(prev => ({
                  ...prev,
                  type: "expense",
                  category_id: "" // Reset category when changing type
                }))}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant={transactionForm.type === "income" ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  transactionForm.type === "income" && "bg-fluxora-purple hover:bg-fluxora-purple/90"
                )}
                onClick={() => setTransactionForm(prev => ({
                  ...prev,
                  type: "income",
                  category_id: "" // Reset category when changing type
                }))}
              >
                Receita
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-roboto">Categoria</label>
            <CategoryCombobox
              options={getTransactionCategoryOptions().filter(opt => 
                transactionForm.type === "income" ? opt.group === "Receitas" : opt.group === "Despesas"
              )}
              value={transactionForm.category_id}
              onChange={(value) => setTransactionForm(prev => ({
                ...prev,
                category_id: value
              }))}
              placeholder="Selecione a categoria"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-roboto">Observação (opcional)</label>
            <Textarea 
              value={transactionForm.observation} 
              onChange={(e) => setTransactionForm(prev => ({
                ...prev,
                observation: e.target.value
              }))}
              placeholder="Ex: Pagamento referente ao mês de abril"
              className="font-roboto resize-none h-20"
            />
          </div>

          {transactionForm.type === 'expense' && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={transactionForm.is_paid}
                onCheckedChange={(checked) => setTransactionForm(prev => ({ 
                  ...prev, 
                  is_paid: checked 
                }))}
              />
              <label htmlFor="is_paid" className="text-sm font-roboto">
                Marcar como pago
              </label>
            </div>
          )}

          <Button 
            className="w-full bg-fluxora-purple hover:bg-fluxora-purple/90"
            onClick={handleSubmit}
            disabled={!transactionForm.description || !transactionForm.amount || !transactionForm.category_id || createOrUpdateTransactionMutation.isPending}
          >
            {createOrUpdateTransactionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingTransaction ? "Atualizando..." : "Adicionando..."}
              </>
            ) : (
              editingTransaction ? "Atualizar Transação" : "Adicionar Transação"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
