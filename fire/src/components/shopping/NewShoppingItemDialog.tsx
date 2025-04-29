import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { formatShoppingCategory, getShoppingCategoryOptions } from "@/lib/categories";

interface NewShoppingItemDialogProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  editingItem?: {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
  };
}

export function NewShoppingItemDialog({ listId, isOpen, onClose, editingItem }: NewShoppingItemDialogProps) {
  const [activeTab, setActiveTab] = useState("select");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [selectForm, setSelectForm] = useState({
    product_id: "",
    quantity: "1",
    price: ""
  });

  const [newProductForm, setNewProductForm] = useState({
    id: "",
    name: "",
    brand: "",
    category: "" as (typeof Constants.public.Enums.product_category)[number],
    unit: "un" as (typeof Constants.public.Enums.unit_measure)[number],
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Filtered products based on search term
  const filteredProducts = products?.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) || 
      (product.brand && product.brand.toLowerCase().includes(searchLower))
    );
  });

  // Transform products for Combobox
  const productOptions = products?.map(product => ({
    label: `${product.name}${product.brand ? ` (${product.brand})` : ''} • ${formatShoppingCategory(product.category)}`,
    value: product.id
  })) || [];

  // Create/Update product mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      try {
        // Ensure category is a valid enum value
        if (!Constants.public.Enums.product_category.includes(newProductForm.category)) {
          throw new Error("Invalid product category");
        }

        if (newProductForm.id) {
          // Update existing product
          const { data, error } = await supabase
            .from('products')
            .update({
              name: newProductForm.name,
              brand: newProductForm.brand || null,
              category: newProductForm.category,
              unit: newProductForm.unit,
              updated_at: new Date().toISOString()
            })
            .eq('id', newProductForm.id)
            .eq('user_id', user?.id)
            .select()
            .maybeSingle();
          
          if (error) {
            console.error('Error updating product:', error);
            throw error;
          }

          if (!data) {
            throw new Error("Produto não encontrado ou você não tem permissão para editá-lo.");
          }

          return data;
        } else {
          // Create new product
          const { data, error } = await supabase
            .from('products')
            .insert({
              name: newProductForm.name,
              brand: newProductForm.brand || null,
              category: newProductForm.category,
              unit: newProductForm.unit,
              user_id: user?.id,
            })
            .select()
            .single();
          
          if (error) {
            console.error('Error creating product:', error);
            throw error;
          }

          return data;
        }
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
      setSelectForm(prev => ({
        ...prev,
        product_id: product.id
      }));
      setActiveTab('select');
      toast({
        title: newProductForm.id ? "Produto atualizado" : "Produto cadastrado",
        description: newProductForm.id 
          ? "O produto foi atualizado com sucesso."
          : "O produto foi cadastrado com sucesso.",
      });
      // Reset form
      setNewProductForm({
        id: "",
        name: "",
        brand: "",
        category: "" as (typeof Constants.public.Enums.product_category)[number],
        unit: "un" as (typeof Constants.public.Enums.unit_measure)[number],
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o produto.",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        // Primeiro verificar se o produto existe e pertence ao usuário
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .eq('user_id', user?.id)
          .single();

        if (productError || !product) {
          throw new Error("Produto não encontrado ou você não tem permissão para excluí-lo.");
        }

        // Verificar se o produto está sendo usado em alguma lista
        const { data: items, error: itemsError } = await supabase
          .from('shopping_items')
          .select('id')
          .eq('product_id', productId);
        
        if (itemsError) {
          console.error('Error checking items:', itemsError);
          throw itemsError;
        }
        
        if (items && items.length > 0) {
          throw new Error("Este produto está sendo usado em uma ou mais listas de compras e não pode ser excluído.");
        }

        // Se não estiver em uso, excluir o produto
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', user?.id);
        
        if (deleteError) {
          console.error('Error deleting product:', deleteError);
          throw deleteError;
        }

        return true;
      } catch (error) {
        console.error('Delete mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      // Fechar o combobox após excluir
      onClose();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir o produto.",
      });
    }
  });

  // Handle product edit
  const handleProductEdit = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      if (product.user_id !== user?.id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você não tem permissão para editar este produto.",
        });
        return;
      }
      setNewProductForm({
        id: product.id,
        name: product.name,
        brand: product.brand || "",
        category: product.category as (typeof Constants.public.Enums.product_category)[number],
        unit: product.unit as (typeof Constants.public.Enums.unit_measure)[number],
      });
      setActiveTab('new');
    }
  };

  // Handle product delete
  const handleProductDelete = async (productId: string) => {
    try {
      if (confirm("Tem certeza que deseja excluir este produto?")) {
        await deleteProductMutation.mutateAsync(productId);
      }
    } catch (error) {
      console.error('Handle delete error:', error);
    }
  };

  // Update form when editing item changes
  useEffect(() => {
    if (editingItem) {
      setSelectForm({
        product_id: editingItem.product_id,
        quantity: editingItem.quantity.toString(),
        price: editingItem.price.toString()
      });
      setActiveTab("select");
    } else {
      setSelectForm({
        product_id: "",
        quantity: "1",
        price: ""
      });
    }
  }, [editingItem]);

  // Add/Update item mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('shopping_items')
          .update({
            quantity: parseFloat(selectForm.quantity),
            price: parseFloat(selectForm.price),
          })
          .eq('id', editingItem.id)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('shopping_items')
          .insert({
            list_id: listId,
            product_id: selectForm.product_id,
            quantity: parseFloat(selectForm.quantity),
            price: parseFloat(selectForm.price),
            user_id: user?.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
      onClose();
      setSelectForm({
        product_id: "",
        quantity: "1",
        price: ""
      });
      setSearchTerm("");
      toast({
        title: editingItem ? "Item atualizado" : "Item adicionado",
        description: editingItem 
          ? "O item foi atualizado na sua lista de compras."
          : "O item foi adicionado à sua lista de compras.",
      });
    }
  });

  const handleAddItem = () => {
    if (!selectForm.product_id || !selectForm.price) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    addItemMutation.mutate();
  };

  const handleCreateProduct = () => {
    if (!newProductForm.name || !newProductForm.category) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha os campos obrigatórios.",
      });
      return;
    }
    
    createProductMutation.mutate();
  };

  const selectedProduct = products?.find(p => p.id === selectForm.product_id);

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-inter">
            {editingItem ? "Editar Item" : newProductForm.id ? "Editar Produto" : "Novo Item"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Selecionar</TabsTrigger>
            <TabsTrigger value="new" disabled={!!editingItem}>Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-roboto">Produto</label>
              <Combobox
                options={productOptions}
                value={selectForm.product_id}
                onChange={(value) => {
                  const product = products?.find(p => p.id === value);
                  setSelectForm(prev => ({
                    ...prev,
                    product_id: value,
                    price: editingItem ? prev.price : (product?.last_price?.toString() || '')
                  }));
                }}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                placeholder="Selecione o produto"
              />
            </div>

            {selectedProduct && (
              <div className="text-xs text-muted-foreground">
                Unidade: {selectedProduct.unit} • Categoria: {formatShoppingCategory(selectedProduct.category)}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-roboto">Quantidade</label>
              <Input 
                type="number"
                value={selectForm.quantity} 
                onChange={(e) => setSelectForm(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))}
                min="0.01"
                step="0.01"
                className="font-roboto"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-roboto">Preço Unitário (R$)</label>
              <Input 
                type="number"
                value={selectForm.price} 
                onChange={(e) => setSelectForm(prev => ({
                  ...prev,
                  price: e.target.value
                }))}
                placeholder="0.00"
                className="font-roboto"
                step="0.01"
              />
            </div>

            <Button 
              className="w-full bg-fluxora-purple hover:bg-fluxora-purple/90"
              onClick={handleAddItem}
              disabled={!selectForm.product_id || !selectForm.price || addItemMutation.isPending}
            >
              {addItemMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingItem ? "Atualizando..." : "Adicionando..."}
                </>
              ) : (
                editingItem ? "Atualizar Item" : "Adicionar Item"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-roboto">Nome do Produto *</label>
              <Input 
                value={newProductForm.name} 
                onChange={(e) => setNewProductForm(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Ex: Leite, Pão, Arroz"
                className="font-roboto"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-roboto">Marca</label>
              <Input 
                value={newProductForm.brand} 
                onChange={(e) => setNewProductForm(prev => ({
                  ...prev,
                  brand: e.target.value
                }))}
                placeholder="Ex: Nestlé, Coca-Cola"
                className="font-roboto"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-roboto">Categoria *</label>
              <CategoryCombobox
                options={getShoppingCategoryOptions()}
                value={newProductForm.category}
                onChange={(value) => setNewProductForm(prev => ({
                  ...prev,
                  category: value as (typeof Constants.public.Enums.product_category)[number]
                }))}
                placeholder="Selecione a categoria"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-roboto">Unidade de Medida</label>
              <Select 
                value={newProductForm.unit} 
                onValueChange={(value) => setNewProductForm(prev => ({
                  ...prev,
                  unit: value as (typeof Constants.public.Enums.unit_measure)[number]
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.unit_measure.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-fluxora-purple hover:bg-fluxora-purple/90"
              onClick={handleCreateProduct}
              disabled={!newProductForm.name || !newProductForm.category || createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Produto"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
