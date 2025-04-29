import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SortAsc, SortDesc, Filter } from "lucide-react";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { getTransactionCategoryOptions } from "@/lib/categories";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export type SortField = "date" | "amount" | "description";
export type SortOrder = "asc" | "desc";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortField: SortField;
  onSortFieldChange: (value: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  showPaidOnly: boolean;
  onPaidOnlyChange: (value: boolean) => void;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  showPaidOnly,
  onPaidOnlyChange,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {(searchTerm || selectedCategory || showPaidOnly) && (
              <span className="ml-2 rounded-full bg-fluxora-purple w-2 h-2" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Busca sempre visível */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <CollapsibleContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Categoria */}
          <div className="w-full sm:w-64">
            <CategoryCombobox
              options={[
                { value: "", label: "Todas as categorias" },
                ...getTransactionCategoryOptions()
              ]}
              value={selectedCategory}
              onChange={onCategoryChange}
              placeholder="Filtrar por categoria"
            />
          </div>

          {/* Campo de ordenação */}
          <div className="flex-1">
            <Select value={sortField} onValueChange={onSortFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="description">Descrição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão de ordem */}
          <Button
            variant="outline"
            onClick={toggleSortOrder}
            className="w-full sm:w-auto"
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4 mr-2" />
            ) : (
              <SortDesc className="h-4 w-4 mr-2" />
            )}
            {sortOrder === "asc" ? "Crescente" : "Decrescente"}
          </Button>

          {/* Mostrar apenas pagos */}
          <Button
            variant={showPaidOnly ? "default" : "outline"}
            onClick={() => onPaidOnlyChange(!showPaidOnly)}
            className="w-full sm:w-auto bg-fluxora-purple hover:bg-fluxora-purple/90"
          >
            {showPaidOnly ? "Mostrar todos" : "Mostrar apenas pagos"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 