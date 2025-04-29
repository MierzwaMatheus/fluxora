
export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  categoryId: string;
}

export interface PlanningList {
  id: string;
  name: string;
  transactions: Transaction[];
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  unit?: string;
  lastPrice: number;
  category: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
  price: number;
  checked: boolean;
  user_id: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  budget: number;
  user_id: string;
  items: ShoppingItem[];
}
