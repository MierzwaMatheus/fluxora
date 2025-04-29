
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import Auth from "./pages/auth/Auth";
import Index from "./pages/Index";
import PlanningList from "./pages/planning/PlanningList";
import PlanningDetail from "./pages/planning/PlanningDetail";
import ShoppingList from "./pages/shopping/ShoppingList";
import ShoppingDetail from "./pages/shopping/ShoppingDetail";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/planning" element={<RequireAuth><PlanningList /></RequireAuth>} />
            <Route path="/planning/:id" element={<RequireAuth><PlanningDetail /></RequireAuth>} />
            <Route path="/shopping" element={<RequireAuth><ShoppingList /></RequireAuth>} />
            <Route path="/shopping/:id" element={<RequireAuth><ShoppingDetail /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
