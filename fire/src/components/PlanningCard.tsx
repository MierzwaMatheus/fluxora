
import { PlanningList } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PlanningCardProps {
  planning: PlanningList;
  onDelete?: (id: string) => void;
}

export function PlanningCard({ planning, onDelete }: PlanningCardProps) {
  const isMobile = useIsMobile();

  // Calculate total income and expenses
  const calculateTotal = (type: 'income' | 'expense') => {
    return planning.transactions
      .filter(transaction => transaction.type === type)
      .reduce((acc, transaction) => acc + Number(transaction.amount), 0);
  };

  const income = calculateTotal('income');
  const expense = calculateTotal('expense');
  
  // Calculate remaining budget and percentage
  const budget = income;
  const totalSpent = expense;
  const remaining = budget - totalSpent;
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  return (
    <Link to={`/planning/${planning.id}`}>
      <Card className="shadow-sm hover:shadow transition-shadow duration-300 relative">
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(planning.id);
            }}
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-50 z-10",
              isMobile ? "block" : "hidden group-hover:block" // Always show on mobile, hover on desktop
            )}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        )}
        <CardHeader className="flex flex-row items-center justify-between pb-2 pr-10">
          <h3 className="text-lg font-inter font-semibold">{planning.name}</h3>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-roboto">Orçamento:</span>
              <span className="font-inter font-semibold">R$ {budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-roboto">Gasto:</span>
              <span className="font-inter font-semibold">R$ {totalSpent.toFixed(2)}</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${remaining < 0 ? 'bg-fluxora-red' : 'bg-fluxora-green'}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-roboto">Restante:</span>
              <span className={`font-inter font-semibold ${remaining < 0 ? 'text-fluxora-red' : 'text-fluxora-green'}`}>
                R$ {remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
