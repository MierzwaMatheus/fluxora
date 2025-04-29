import { ShoppingList } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Trash2, Edit, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShoppingCardProps {
  list: {
    id: string;
    name: string;
    budget: number;
    user_id: string;
    shopping_items: Array<{
      price: number;
      quantity: number;
      checked: boolean;
    }>;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function ShoppingCard({ list, onDelete, onEdit, onDuplicate }: ShoppingCardProps) {
  const isMobile = useIsMobile();
  
  const totalSpent = list.shopping_items.reduce((acc, item) => {
    return acc + (Number(item.price) * Number(item.quantity));
  }, 0);
  
  const budget = Number(list.budget);
  const remaining = budget - totalSpent;
  const budgetPercentage = (totalSpent / budget) * 100;
  
  const isOverBudget = remaining < 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(list.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(list.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(list.id);
    }
  };

  return (
    <Link to={`/shopping/${list.id}`}>
      <Card className="shadow-sm hover:shadow transition-shadow duration-300 relative">
        <div className="absolute top-3 right-3 flex">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-full hover:bg-blue-50 z-10 mr-1"
              title="Editar lista"
            >
              <Edit className="h-4 w-4 text-blue-500" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={handleDuplicate}
              className="p-1.5 rounded-full hover:bg-green-50 z-10 mr-1"
              title="Duplicar lista"
            >
              <Copy className="h-4 w-4 text-green-500" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full hover:bg-red-50 z-10"
              title="Excluir lista"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pr-24">
          <h3 className="text-lg font-inter font-semibold">{list.name}</h3>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-roboto">Orçamento:</span>
              <span className="font-inter font-medium">R$ {budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-roboto">Gasto:</span>
              <span className="font-inter font-medium">R$ {totalSpent.toFixed(2)}</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isOverBudget ? 'bg-fluxora-red' : 'bg-fluxora-green'}`} 
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-roboto">Restante:</span>
              <span className={`font-inter font-medium ${isOverBudget ? 'text-fluxora-red' : 'text-fluxora-green'}`}>
                R$ {remaining.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-muted-foreground font-roboto">Itens:</span>
              <span className="font-inter font-medium">
                {list.shopping_items.length} 
                {list.shopping_items.length > 0 && (
                  <>
                    {" "}
                    <span className="text-muted-foreground">
                      ({list.shopping_items.filter(item => item.checked).length} comprados)
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
