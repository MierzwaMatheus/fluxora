import { useState } from "react";
import { Plus, Loader2, Trash2, Edit, Copy } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ShoppingCard } from "@/components/shopping/ShoppingCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";

const ShoppingList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [search, setSearch] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newListBudget, setNewListBudget] = useState("");
  const [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false);
  
  // Estado para edição de lista
  const [editingList, setEditingList] = useState<{
    id: string;
    name: string;
    budget: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: shoppingLists, isLoading } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_items (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  const createListMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          name: newListName,
          budget: parseFloat(newListBudget),
          user_id: user?.id
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setNewListName("");
      setNewListBudget("");
      setIsNewListDialogOpen(false);
      toast({
        title: "Lista criada",
        description: "Sua lista de compras foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar lista",
        description: error.message,
      });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async () => {
      if (!editingList) return null;
      
      const { data, error } = await supabase
        .from('shopping_lists')
        .update({
          name: editingList.name,
          budget: parseFloat(editingList.budget)
        })
        .eq('id', editingList.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setEditingList(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Lista atualizada",
        description: "Sua lista de compras foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar lista",
        description: error.message,
      });
    },
  });

  const duplicateListMutation = useMutation({
    mutationFn: async (listId: string) => {
      // 1. Buscar a lista original
      const { data: originalList, error: fetchError } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_items(*)
        `)
        .eq('id', listId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Criar uma nova lista com os mesmos dados
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          name: `${originalList.name} (Cópia)`,
          budget: originalList.budget,
          user_id: user?.id
        })
        .select();

      if (createError) throw createError;

      // 3. Copiar os itens (desmarcar todos os itens)
      if (originalList.shopping_items.length > 0) {
        const itemsToInsert = originalList.shopping_items.map(item => ({
          list_id: newList[0].id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          checked: false,
          user_id: user?.id
        }));

        const { error: insertError } = await supabase
          .from('shopping_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      return newList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast({
        title: "Lista duplicada",
        description: "Sua lista de compras foi duplicada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao duplicar lista",
        description: error.message,
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast({
        title: "Lista removida",
        description: "Sua lista de compras foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover lista",
        description: error.message,
      });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim() || !newListBudget) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha o nome e o orçamento da lista.",
      });
      return;
    }
    
    createListMutation.mutate();
  };

  const handleUpdateList = () => {
    if (!editingList || !editingList.name.trim() || !editingList.budget) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Por favor, preencha o nome e o orçamento da lista.",
      });
      return;
    }
    
    updateListMutation.mutate();
  };

  const filteredLists = shoppingLists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-6">
        <div className="container">
          <h1 className="text-2xl font-inter font-semibold">Listas de Compras</h1>
        </div>
      </header>

      <main className="container mt-6">
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-6`}>
          <div className={`relative ${isMobile ? 'w-full' : 'w-full max-w-sm'}`}>
            <Input
              type="text"
              placeholder="Buscar listas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 font-roboto"
            />
          </div>

          {/* Botão para criar nova lista */}
          <Dialog open={isNewListDialogOpen} onOpenChange={setIsNewListDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fluxora-purple hover:bg-fluxora-purple/90">
                <Plus className="h-5 w-5 mr-1" /> Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Lista de Compras</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da lista</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Compras do mês"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Ex: 500.00"
                    value={newListBudget}
                    onChange={(e) => setNewListBudget(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateList}
                  className="bg-fluxora-purple hover:bg-fluxora-purple/90"
                  disabled={createListMutation.isPending}
                >
                  {createListMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Lista'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog para editar lista */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Lista de Compras</DialogTitle>
              </DialogHeader>
              {editingList && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome da lista</Label>
                    <Input
                      id="edit-name"
                      placeholder="Ex: Compras do mês"
                      value={editingList.name}
                      onChange={(e) => setEditingList({...editingList, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-budget">Orçamento (R$)</Label>
                    <Input
                      id="edit-budget"
                      type="number"
                      placeholder="Ex: 500.00"
                      value={editingList.budget}
                      onChange={(e) => setEditingList({...editingList, budget: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleUpdateList}
                  className="bg-fluxora-purple hover:bg-fluxora-purple/90"
                  disabled={updateListMutation.isPending}
                >
                  {updateListMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-fluxora-purple" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLists.length > 0 ? (
              filteredLists.map(list => (
                <div key={list.id} className="group relative">
                  <ShoppingCard 
                    list={list} 
                    onDelete={(id) => deleteListMutation.mutate(id)}
                    onEdit={(id) => {
                      const listToEdit = shoppingLists.find(l => l.id === id);
                      if (listToEdit) {
                        setEditingList({
                          id: listToEdit.id,
                          name: listToEdit.name,
                          budget: listToEdit.budget.toString()
                        });
                        setIsEditDialogOpen(true);
                      }
                    }}
                    onDuplicate={(id) => duplicateListMutation.mutate(id)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-roboto">
                  {search ? "Nenhuma lista encontrada" : "Crie sua primeira lista de compras"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Navbar />
    </div>
  );
};

export default ShoppingList;
