
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlanningCardProps {
  list: {
    id: string;
    name: string;
    planning_transactions: Array<{
      amount: number;
      type: string;
    }>;
  };
  onDelete?: (id: string) => void;
}

export function PlanningCard({ list, onDelete }: PlanningCardProps) {
  const isMobile = useIsMobile();
  
  const calculateTotal = (type: 'income' | 'expense') => {
    return list.planning_transactions
      .filter(transaction => transaction.type === type)
      .reduce((acc, transaction) => acc + Number(transaction.amount), 0);
  };

  const income = calculateTotal('income');
  const expense = calculateTotal('expense');
  const balance = income - expense;
  
  const isPositive = balance >= 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(list.id);
    }
  };

  return (
    <Link to={`/planning/${list.id}`} className="block relative">
      <Card className="shadow-sm hover:shadow transition-shadow duration-300">
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-50 z-10 block"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        )}
        <CardHeader className="flex flex-row items-center justify-between pb-2 pr-10">
          <h3 className="text-lg font-inter font-semibold">{list.name}</h3>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'}`}>
            <div>
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-inter font-semibold text-fluxora-green">
                R$ {income.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="font-inter font-semibold text-fluxora-red">
                R$ {expense.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`font-inter font-semibold ${isPositive ? 'text-fluxora-green' : 'text-fluxora-red'}`}>
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
