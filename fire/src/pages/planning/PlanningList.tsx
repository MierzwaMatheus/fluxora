import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlanningCard } from "@/components/planning/PlanningCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

const PlanningList = () => {
  const [search, setSearch] = useState("");
  const [newListName, setNewListName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lists, isLoading } = useQuery({
    queryKey: ['planning-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_lists')
        .select(`
          *,
          planning_transactions (*)
        `);

      if (error) throw error;
      return data;
    }
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('planning_lists')
        .insert([{ name, user_id: user?.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-lists'] });
      setIsDialogOpen(false);
      setNewListName("");
      toast({
        title: "Lista criada",
        description: "Sua lista foi criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a lista. Tente novamente.",
      });
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('planning_lists')
        .delete()
        .eq('id', listId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-lists'] });
      toast({
        title: "Lista excluída",
        description: "A lista foi excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a lista. Tente novamente.",
      });
    }
  });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createListMutation.mutate(newListName);
  };

  const filteredLists = lists?.filter(list => 
    list.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-fluxora-purple rounded-full animate-spin mx-auto mb-2"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-6">
        <div className="container">
          <h1 className="text-2xl font-inter font-semibold">Planejamento</h1>
        </div>
      </header>

      <main className="container mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-full max-w-sm">
            <Input
              type="text"
              placeholder="Buscar listas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 font-roboto"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-2 bg-fluxora-purple hover:bg-fluxora-purple/90">
                <Plus className="h-5 w-5 mr-1" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-inter">Nova Lista de Planejamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-roboto">Nome da Lista</label>
                  <Input 
                    value={newListName} 
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ex: Mensal, Viagem, Projeto"
                    className="font-roboto"
                  />
                </div>
                <Button 
                  className="w-full bg-fluxora-purple hover:bg-fluxora-purple/90"
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || createListMutation.isPending}
                >
                  {createListMutation.isPending ? "Criando..." : "Criar Lista"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {filteredLists.length > 0 ? (
            filteredLists.map(list => (
              <div key={list.id} className="relative">
                <PlanningCard 
                  list={list} 
                  onDelete={() => deleteListMutation.mutate(list.id)} 
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-roboto">
                {search ? "Nenhuma lista encontrada" : "Crie sua primeira lista de planejamento"}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Navbar />
    </div>
  );
};

export default PlanningList;
