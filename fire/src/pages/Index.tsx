
import { Link } from "react-router-dom";
import { PlusCircle, TrendingUp, List, ShoppingCart, PieChart, ArrowRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: financialSummary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      // Get planning data
      const { data: planningData, error: planningError } = await supabase
        .from('planning_lists')
        .select(`
          *,
          planning_transactions (*)
        `)
        .eq('user_id', user?.id);
      
      if (planningError) throw planningError;
      
      // Get shopping data
      const { data: shoppingData, error: shoppingError } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_items (*)
        `)
        .eq('user_id', user?.id);
      
      if (shoppingError) throw shoppingError;
      
      // Calculate totals
      const totalIncome = (planningData || []).reduce((acc, list) => {
        const listIncome = list.planning_transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return acc + listIncome;
      }, 0);
      
      const totalExpense = (planningData || []).reduce((acc, list) => {
        const listExpense = list.planning_transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return acc + listExpense;
      }, 0);
      
      const totalBudget = (shoppingData || []).reduce((acc, list) => 
        acc + Number(list.budget), 0);
      
      const totalSpent = (shoppingData || []).reduce((acc, list) => {
        const listSpent = list.shopping_items.reduce((sum, item) => 
          sum + (Number(item.price) * Number(item.quantity)), 0);
        return acc + listSpent;
      }, 0);
      
      return {
        balance: totalIncome - totalExpense,
        budget: totalBudget,
        spent: totalSpent,
        budgetRemaining: totalBudget - totalSpent,
        trend: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
      };
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-8">
        <div className="container">
          <h1 className="text-3xl font-inter font-semibold">Fluxora</h1>
          <p className="font-roboto mt-2 text-gray-300">Gerencie suas finanças com facilidade</p>
        </div>
      </header>

      <main className="container mt-8">
        <section className="grid gap-6">
          <Card className="shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-fluxora-purple to-fluxora-darkBlue p-6 text-white">
              <p className="text-xl font-inter font-semibold mb-1">Bem-vindo(a) de volta!</p>
              <p className="text-sm font-roboto opacity-80">Veja um resumo da sua situação financeira</p>
            </div>
            <CardContent className="p-6">
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-4`}>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
                  <p className={`text-xl font-inter font-semibold ${financialSummary?.balance && financialSummary.balance >= 0 ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
                    R$ {financialSummary?.balance ? financialSummary.balance.toFixed(2) : '0,00'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-muted-foreground mb-1">Orçamento Restante</p>
                  <p className="text-xl font-inter font-semibold text-fluxora-purple">
                    R$ {financialSummary?.budgetRemaining ? financialSummary.budgetRemaining.toFixed(2) : '0,00'}
                  </p>
                </div>
                {!isMobile && (
                  <>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-muted-foreground mb-1">Planejamento</p>
                      <p className="text-xl font-inter font-semibold text-fluxora-darkBlue">
                        <Link to="/planning" className="flex items-center hover:underline">
                          Ver Listas <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-muted-foreground mb-1">Compras</p>
                      <p className="text-xl font-inter font-semibold text-fluxora-darkBlue">
                        <Link to="/shopping" className="flex items-center hover:underline">
                          Ver Listas <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {isMobile && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Tendência Mensal</p>
                    <div className="flex items-center text-fluxora-green text-xs">
                      {financialSummary?.trend && financialSummary.trend >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span>{Math.abs(financialSummary.trend).toFixed(0)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1 text-fluxora-red" />
                          <span className="text-fluxora-red">{Math.abs(financialSummary?.trend || 0).toFixed(0)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <h2 className="text-xl font-inter font-semibold mb-4">Comece a gerenciar</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/planning">
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-fluxora-purple transition-colors">
                    <List className="h-10 w-10 text-fluxora-darkBlue mb-3" />
                    <span className="text-center font-roboto">Planejamento</span>
                  </div>
                </Link>
                <Link to="/shopping">
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-fluxora-purple transition-colors">
                    <ShoppingCart className="h-10 w-10 text-fluxora-darkBlue mb-3" />
                    <span className="text-center font-roboto">Compras</span>
                  </div>
                </Link>
                <Link to="/dashboard">
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-fluxora-purple transition-colors">
                    <PieChart className="h-10 w-10 text-fluxora-darkBlue mb-3" />
                    <span className="text-center font-roboto">Dashboard</span>
                  </div>
                </Link>
                {financialSummary?.balance && financialSummary.balance < 0 ? (
                  <Link to="/planning">
                    <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-6 border border-red-200 hover:border-fluxora-red transition-colors">
                      <Wallet className="h-10 w-10 text-fluxora-red mb-3" />
                      <span className="text-center font-roboto">Controlar gastos</span>
                    </div>
                  </Link>
                ) : (
                  <Link to="/planning">
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-slate-200 hover:border-fluxora-purple transition-colors">
                      <PlusCircle className="h-10 w-10 text-fluxora-purple mb-3" />
                      <span className="text-center font-roboto">Nova</span>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            <Link to="/dashboard" className="min-w-[280px] md:flex-1">
              <Card className="hover:shadow transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-inter font-semibold">Dashboard</h3>
                    <PieChart className="h-6 w-6 text-fluxora-purple" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visualize seus gastos e analise suas finanças para tomar melhores decisões.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/shopping" className="min-w-[280px] md:flex-1">
              <Card className="hover:shadow transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-inter font-semibold">Compras</h3>
                    <ShoppingCart className="h-6 w-6 text-fluxora-purple" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas listas de compras para manter o controle do seu orçamento.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Ver Listas
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/planning" className="min-w-[280px] md:flex-1">
              <Card className="hover:shadow transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-inter font-semibold">Planejamento</h3>
                    <List className="h-6 w-6 text-fluxora-purple" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Planeje seu futuro financeiro com nossas ferramentas de planejamento.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Ver Planos
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
      
      <Navbar />
    </div>
  );
};

export default Index;
