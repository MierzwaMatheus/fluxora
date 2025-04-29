import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus, ShoppingBag, Trash2, Pencil, AlertCircle, Filter, Search, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/ui/navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingItem } from "@/types";
import { Loader2 } from "lucide-react";
import { NewShoppingItemDialog } from "@/components/shopping/NewShoppingItemDialog";
import { Badge } from "@/components/ui/badge";
import { SortField, SortOrder } from "../../components/shopping/ShoppingFilters";
import { formatShoppingCategory } from "@/lib/categories";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const ShoppingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
  } | undefined>(undefined);
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showPurchasedOnly, setShowPurchasedOnly] = useState(false);

  // Form state for new item
  const [itemForm, setItemForm] = useState({
    product_id: "",
    quantity: "1",
    price: ""
  });

  // Estado para modal de confirmação de exclusão
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch shopping list details AND products
  const { data: list, isLoading, error } = useQuery({
    queryKey: ['shopping-list', id],
    queryFn: async () => {
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
      
      if (listError) throw listError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (productsError) throw productsError;
      
      return {
        id: listData.id,
        name: listData.name,
        budget: listData.budget,
        user_id: listData.user_id,
        items: listData.shopping_items || [],
        products: productsData || []
      };
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const newItem = {
        list_id: id,
        product_id: itemForm.product_id,
        quantity: parseFloat(itemForm.quantity),
        price: parseFloat(itemForm.price),
        checked: false,
        user_id: user?.id
      };

      const { error } = await supabase
        .from('shopping_items')
        .insert([newItem]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', id] });
      setIsDialogOpen(false);
      setItemForm({
        product_id: "",
        quantity: "1",
        price: ""
      });
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado à sua lista de compras.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o item. Tente novamente.",
      });
    }
  });

  const toggleItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Find the current state of the item
      const item = list?.items.find(item => item.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('shopping_items')
        .update({ checked: !item.checked })
        .eq('id', itemId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', id] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o item. Tente novamente.",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', id] });
      toast({
        title: "Item removido",
        description: "O item foi removido da sua lista de compras.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o item. Tente novamente.",
      });
    }
  });

  // Calculate totals when list changes
  const totalSpent = list ? list.items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0) : 0;
  
  const budget = list?.budget || 0;
  const remaining = budget - totalSpent;
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  
  const isOverBudget = remaining < 0;

  // Função para filtrar e ordenar os itens
  const getFilteredItems = () => {
    if (!list?.items) return { toBuy: [], purchased: [] };

    let filteredItems = [...list.items];

    // Aplicar filtros
    if (searchTerm) {
      filteredItems = filteredItems.filter(item => {
        const product = list.products?.find(p => p.id === item.product_id);
        return product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               product?.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filteredItems = filteredItems.filter(item => {
        const product = list.products?.find(p => p.id === item.product_id);
        return product?.category === selectedCategory;
      });
    }

    if (showPurchasedOnly) {
      filteredItems = filteredItems.filter(item => item.checked);
    }

    // Separar itens a comprar e itens comprados
    const toBuy = filteredItems.filter(item => !item.checked);
    const purchased = filteredItems.filter(item => item.checked);

    // Aplicar ordenação em cada grupo
    const sortItems = (items: any[]) => {
      return items.sort((a, b) => {
        const productA = list.products?.find(p => p.id === a.product_id);
        const productB = list.products?.find(p => p.id === b.product_id);

        if (!productA || !productB) return 0;

        let comparison = 0;
        switch (sortField) {
          case "name":
            comparison = productA.name.localeCompare(productB.name);
            break;
          case "price":
            comparison = a.price - b.price;
            break;
          case "quantity":
            comparison = a.quantity - b.quantity;
            break;
          case "category":
            comparison = productA.category.localeCompare(productB.category);
            break;
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
    };

    return {
      toBuy: sortItems(toBuy),
      purchased: sortItems(purchased)
    };
  };

  const handleAddItem = () => {
    if (!itemForm.product_id || !itemForm.price) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    addItemMutation.mutate();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // If a product is selected, auto-fill the last price
    if (name === "product_id" && list?.products) {
      const selectedProduct = list.products.find(p => p.id === value);
      if (selectedProduct) {
        setItemForm(prev => ({
          ...prev,
          product_id: value,
          price: selectedProduct.last_price?.toString() || ''
        }));
      } else {
        setItemForm(prev => ({
          ...prev,
          product_id: value
        }));
      }
    } else {
      setItemForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Modificar a função de deletar item
  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete);
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-fluxora-purple mx-auto mb-2" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-800 mb-2">Lista não encontrada</p>
        <p className="text-muted-foreground text-center mb-6">A lista de compras solicitada não existe ou você não tem permissão para acessá-la.</p>
        <Button 
          onClick={() => navigate("/shopping")}
          className="bg-fluxora-purple hover:bg-fluxora-purple/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Listas
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-6">
        <div className="container">
          <button 
            onClick={() => navigate("/shopping")}
            className="flex items-center text-gray-300 hover:text-white mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm font-roboto">Voltar</span>
          </button>
          <h1 className="text-2xl font-inter font-semibold">{list.name}</h1>
        </div>
      </header>

      <main className="container mt-6">
        {/* Budget card */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-roboto">Orçamento:</span>
            <span className="font-inter font-semibold">R$ {budget.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-roboto">Gasto até agora:</span>
            <span className="font-inter font-semibold">R$ {totalSpent.toFixed(2)}</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full ${isOverBudget ? 'bg-fluxora-red' : 'bg-fluxora-green'}`} 
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-roboto">Restante:</span>
            <span className={`font-inter font-semibold ${isOverBudget ? 'text-fluxora-red' : 'text-fluxora-green'}`}>
              R$ {remaining.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-inter font-semibold">Itens da Lista</h2>

          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-fluxora-purple hover:bg-fluxora-purple/90"
          >
            <Plus className="h-5 w-5 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          {/* Implementação completa de filtros */}
          <Collapsible className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(searchTerm || selectedCategory || showPurchasedOnly) && (
                    <span className="ml-2 rounded-full bg-fluxora-purple w-2 h-2" />
                  )}
                </Button>
              </CollapsibleTrigger>

              {/* Busca sempre visível */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <CollapsibleContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Categoria */}
                <div className="w-full sm:w-64">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {list.products && Array.from(new Set(list.products.map(p => p.category))).map(category => (
                        <SelectItem key={category} value={category}>
                          {formatShoppingCategory(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo de ordenação */}
                <div className="flex-1">
                  <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="price">Preço</SelectItem>
                      <SelectItem value="quantity">Quantidade</SelectItem>
                      <SelectItem value="category">Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de ordem */}
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="w-full sm:w-auto"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  {sortOrder === "asc" ? "Crescente" : "Decrescente"}
                </Button>

                {/* Botão de mostrar apenas comprados */}
                <Button
                  variant={showPurchasedOnly ? "default" : "outline"}
                  onClick={() => setShowPurchasedOnly(!showPurchasedOnly)}
                  className="w-full sm:w-auto bg-fluxora-purple hover:bg-fluxora-purple/90"
                >
                  {showPurchasedOnly ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Mostrar todos
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Mostrar apenas comprados
                    </>
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Seção: Itens a Comprar */}
        {getFilteredItems().toBuy.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-inter font-medium mb-3">Itens a Comprar</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y">
              {getFilteredItems().toBuy.map(item => {
                const product = list.products?.find(p => p.id === item.product_id);
                
                if (!product) return null;
                
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <Checkbox 
                        checked={item.checked}
                        onCheckedChange={() => toggleItemMutation.mutate(item.id)}
                        className="mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-inter font-medium truncate">
                          {product.name}
                        </p>
                        <div className="flex flex-col">
                          <p className="text-xs text-muted-foreground font-roboto">
                            <span className="font-medium">{item.quantity} {product.unit || 'un'}</span>
                            {product.brand && <span> • {product.brand}</span>}
                          </p>
                          <Badge className="mt-1 w-fit bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                            {formatShoppingCategory(product.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="font-inter font-semibold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seção: Itens Comprados */}
        {getFilteredItems().purchased.length > 0 && (
          <div>
            <h3 className="text-md font-inter font-medium mb-3">Itens Comprados</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y">
              {getFilteredItems().purchased.map(item => {
                const product = list.products?.find(p => p.id === item.product_id);
                
                if (!product) return null;
                
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center flex-1 min-w-0">
                      <Checkbox 
                        checked={item.checked}
                        onCheckedChange={() => toggleItemMutation.mutate(item.id)}
                        className="mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-inter font-medium truncate line-through text-gray-400">
                          {product.name}
                        </p>
                        <div className="flex flex-col">
                          <p className="text-xs text-muted-foreground font-roboto line-through">
                            <span className="font-medium">{item.quantity} {product.unit || 'un'}</span>
                            {product.brand && <span> • {product.brand}</span>}
                          </p>
                          <Badge className="mt-1 w-fit bg-gray-100 text-gray-500 hover:bg-gray-200 border-0">
                            {formatShoppingCategory(product.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="font-inter font-semibold text-gray-400">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensagem de lista vazia */}
        {getFilteredItems().toBuy.length === 0 && getFilteredItems().purchased.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-muted-foreground font-roboto">
                  {searchTerm || selectedCategory || showPurchasedOnly
                    ? "Nenhum item encontrado com os filtros selecionados"
                    : "Sua lista de compras está vazia"}
                </p>
                <p className="text-xs text-muted-foreground font-roboto mt-1">
                  {searchTerm || selectedCategory || showPurchasedOnly
                    ? "Tente ajustar os filtros"
                    : "Adicione itens usando o botão acima"}
                </p>
              </div>
            </div>
          </div>
        )}

        <NewShoppingItemDialog
          listId={id}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingItem(undefined);
          }}
          editingItem={editingItem}
        />

        {/* Modal de confirmação de exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este item da lista de compras?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
              <AlertCircle className="h-16 w-16 text-red-500 mb-2" />
            </div>
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <Navbar />
    </div>
  );
};

export default ShoppingDetail;
