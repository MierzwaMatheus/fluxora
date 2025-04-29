import { useState, useEffect } from "react";
import { ArrowDownUp, DollarSign, PieChart, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const { data: planningLists = [] } = useQuery({
    queryKey: ['planning-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_lists')
        .select(`
          *,
          planning_transactions (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: shoppingLists = [] } = useQuery({
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
    }
  });

  // Buscar todos os produtos
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      return data || [];
    }
  });

  // Calculate the totals from the planning lists
  const totalIncome = planningLists.reduce((acc, list) => {
    const listIncome = list.planning_transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + Number(t.amount), 0);
    return acc + listIncome;
  }, 0);

  const totalExpense = planningLists.reduce((acc, list) => {
    const listExpense = list.planning_transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + Number(t.amount), 0);
    return acc + listExpense;
  }, 0);

  const totalBalance = totalIncome - totalExpense;
  const isPositive = totalBalance >= 0;

  // Calculate the total shopping budget and spent
  const totalBudget = shoppingLists.reduce((acc, list) => acc + Number(list.budget), 0);
  
  const totalSpent = shoppingLists.reduce((acc, list) => {
    const listSpent = list.shopping_items.reduce((total, item) => 
      total + (Number(item.price) * Number(item.quantity)), 0);
    return acc + listSpent;
  }, 0);

  const totalRemaining = totalBudget - totalSpent;

  // Calculate the top categories
  const categoriesMap = new Map();
  
  planningLists.forEach(list => {
    list.planning_transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const currentAmount = categoriesMap.get(transaction.category_id) || 0;
        categoriesMap.set(transaction.category_id, currentAmount + Number(transaction.amount));
      });
  });
  
  const topCategories = Array.from(categoriesMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 5);

  // Calculate top products from real shopping data
  const productsMap = new Map();
  const priceHistory = new Map();
  
  // Calcula a variação de preço usando o histórico de compras
  // Primeiro, vamos construir um histórico de preços por produto
  shoppingLists.forEach(list => {
    list.shopping_items.forEach(item => {
      if (!priceHistory.has(item.product_id)) {
        priceHistory.set(item.product_id, []);
      }
      
      priceHistory.get(item.product_id).push({
        price: Number(item.price),
        date: list.created_at
      });
    });
  });
  
  // Agora vamos calcular a frequência e variação de preço
  shoppingLists.forEach(list => {
    list.shopping_items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        // Se o produto já foi contabilizado, incrementa a frequência
        if (productsMap.has(product.id)) {
          const currentData = productsMap.get(product.id);
          productsMap.set(product.id, {
            ...currentData,
            frequency: currentData.frequency + 1,
            totalSpent: currentData.totalSpent + (Number(item.price) * Number(item.quantity))
          });
        } else {
          // Caso contrário, adiciona o produto no mapa
          const priceChanges = priceHistory.get(product.id) || [];
          
          // Cálculo da variação de preço (se tivermos pelo menos 2 preços registrados)
          let priceChange = 0;
          if (priceChanges.length >= 2) {
            // Ordena por data (do mais antigo para o mais recente)
            priceChanges.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const oldestPrice = priceChanges[0].price;
            const latestPrice = priceChanges[priceChanges.length - 1].price;
            
            // Calcula a variação percentual
            if (oldestPrice > 0) {
              priceChange = Math.round(((latestPrice - oldestPrice) / oldestPrice) * 100);
            }
          }
          
          productsMap.set(product.id, {
            id: product.id,
            name: product.name,
            frequency: 1,
            priceChange,
            totalSpent: Number(item.price) * Number(item.quantity)
          });
        }
      }
    });
  });
  
  const topProducts = Array.from(productsMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-fluxora-darkBlue text-white py-6">
        <div className="container">
          <h1 className="text-2xl font-inter font-semibold">Dashboard</h1>
        </div>
      </header>

      <main className="container mt-6">
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
          <StatCard 
            title="Saldo Consolidado" 
            value={`R$ ${totalBalance.toFixed(2)}`} 
            icon={<DollarSign className="h-6 w-6 text-fluxora-darkBlue" />}
            trend={{ value: isPositive ? 8 : -8, isPositive }}
          />
          <StatCard 
            title="Orçamento Restante" 
            value={`R$ ${totalRemaining.toFixed(2)}`} 
            icon={<ShoppingBag className="h-6 w-6 text-fluxora-darkBlue" />}
          />
        </div>

        <Tabs defaultValue="categories" className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="categories">Top Categorias</TabsTrigger>
            <TabsTrigger value="products">Top Produtos</TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            <Card>
              <CardContent className="pt-6">
                {topCategories.length > 0 ? (
                  topCategories.map((category, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-roboto">{category.name}</span>
                        <span className="font-inter font-semibold">R$ {Number(category.value).toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-fluxora-purple"
                          style={{ width: `${(Number(category.value) / Number(topCategories[0]?.value || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground font-roboto">Nenhuma transação registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="products">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mb-2 px-2">
                    <span>Produto</span>
                    <span className="text-center">Frequência</span>
                    <span className="text-right">Variação de Preço</span>
                  </div>
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 items-center p-2 bg-slate-50 rounded-md">
                        <span className="font-roboto truncate pr-4">{product.name}</span>
                        <span className="flex items-center justify-center">
                          <ArrowDownUp className="h-4 w-4 mr-1 text-fluxora-purple" />
                          {product.frequency}x
                        </span>
                        <span className={`flex items-center justify-end ${product.priceChange > 0 ? 'text-fluxora-red' : product.priceChange < 0 ? 'text-fluxora-green' : 'text-gray-500'}`}>
                          {product.priceChange > 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : product.priceChange < 0 ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          ) : null}
                          {product.priceChange > 0 ? '+' : ''}{product.priceChange}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground font-roboto">Nenhum produto registrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mb-6">
          <h2 className="text-lg font-inter font-semibold mb-4">Alertas de Variação</h2>
          <Card>
            <CardContent className="pt-6">
              {planningLists.length > 0 || shoppingLists.length > 0 ? (
                <div className="space-y-3">
                  {totalExpense > totalIncome && (
                    <div className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-100">
                      <div className="flex items-center">
                        <div className="bg-red-100 p-2 rounded-full mr-3">
                          <TrendingUp className="h-5 w-5 text-fluxora-red" />
                        </div>
                        <div>
                          <p className="font-inter font-medium">Despesas</p>
                          <p className="text-xs text-muted-foreground font-roboto">
                            Despesas maiores que receitas
                          </p>
                        </div>
                      </div>
                      <p className="text-fluxora-red font-inter font-semibold">
                        {Math.abs(((totalExpense - totalIncome) / totalIncome) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  {totalSpent > 0.8 * totalBudget && (
                    <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md border border-amber-100">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <Wallet className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-inter font-medium">Orçamento</p>
                          <p className="text-xs text-muted-foreground font-roboto">
                            Próximo ao limite do orçamento
                          </p>
                        </div>
                      </div>
                      <p className="text-amber-500 font-inter font-semibold">
                        {((totalSpent / totalBudget) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  {!totalExpense && !totalIncome && !totalSpent && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground font-roboto">
                        Comece a registrar transações para ver alertas relevantes
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground font-roboto">
                    Comece a registrar transações para ver alertas relevantes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-inter font-semibold mb-4">Comparação de Saldo</h2>
          <Card>
            <CardContent className="pt-6">
              {planningLists.length > 0 ? (
                <div className="space-y-4">
                  {planningLists.map((list, index) => {
                    const income = list.planning_transactions
                      .filter(t => t.type === 'income')
                      .reduce((acc, t) => acc + Number(t.amount), 0);
                    
                    const expense = list.planning_transactions
                      .filter(t => t.type === 'expense')
                      .reduce((acc, t) => acc + Number(t.amount), 0);
                    
                    const balance = income - expense;
                    const isPos = balance >= 0;
                    
                    // Find max absolute balance for percentage calculation
                    const maxBalance = Math.max(
                      ...planningLists.map(l => {
                        const inc = l.planning_transactions
                          .filter(t => t.type === 'income')
                          .reduce((a, t) => a + Number(t.amount), 0);
                        const exp = l.planning_transactions
                          .filter(t => t.type === 'expense')
                          .reduce((a, t) => a + Number(t.amount), 0);
                        return Math.abs(inc - exp);
                      })
                    );

                    return (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-roboto">{list.name}</span>
                          <span className={`font-inter font-semibold ${isPos ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
                            R$ {balance.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isPos ? 'bg-fluxora-green' : 'bg-fluxora-red'}`}
                            style={{ width: `${Math.min(Math.abs(balance) / (maxBalance || 1) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground font-roboto">
                    Crie listas de planejamento para comparar saldos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Navbar />
    </div>
  );
};

export default Dashboard;
