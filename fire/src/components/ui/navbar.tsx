import { Home, List, LogOut, PieChart, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "./button";

export function Navbar() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 py-2">
      <div className="container mx-auto">
        <div className="flex items-center justify-around">
          <NavItem to="/" icon={<Home />} label="Home" isActive={isActive("/")} />
          <NavItem to="/planning" icon={<List />} label="Planejamento" isActive={isActive("/planning")} />
          <NavItem to="/shopping" icon={<ShoppingCart />} label="Compras" isActive={isActive("/shopping")} />
          <NavItem to="/dashboard" icon={<PieChart />} label="Dashboard" isActive={isActive("/dashboard")} />
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center justify-center px-4 py-2 space-y-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center px-4 py-2 space-y-1 text-xs rounded-md transition-colors ${
        isActive 
          ? "text-fluxora-purple bg-slate-100" 
          : "text-gray-600 hover:text-fluxora-darkBlue"
      }`}
    >
      <div className={`${isActive ? "text-fluxora-purple" : "text-gray-500"}`}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}
