
import { Category, PlanningList, Product, ShoppingList } from '@/types';

// Mock Categories
export const categories: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'utensils' },
  { id: '2', name: 'Transporte', icon: 'car' },
  { id: '3', name: 'Moradia', icon: 'home' },
  { id: '4', name: 'Lazer', icon: 'smile' },
  { id: '5', name: 'Saúde', icon: 'heart' },
  { id: '6', name: 'Educação', icon: 'book' },
  { id: '7', name: 'Outros', icon: 'package' },
];

// Mock Planning Lists
export const planningLists: PlanningList[] = [
  {
    id: '1',
    name: 'Mensal',
    transactions: [
      { id: '1', description: 'Salário', amount: 5000, type: 'income', date: '2023-04-05', categoryId: '7' },
      { id: '2', description: 'Aluguel', amount: 1500, type: 'expense', date: '2023-04-10', categoryId: '3' },
      { id: '3', description: 'Supermercado', amount: 800, type: 'expense', date: '2023-04-15', categoryId: '1' },
    ],
  },
  {
    id: '2',
    name: 'Viagem Paris',
    transactions: [
      { id: '4', description: 'Reserva Hotel', amount: 2000, type: 'expense', date: '2023-05-01', categoryId: '4' },
      { id: '5', description: 'Passagens Aéreas', amount: 3000, type: 'expense', date: '2023-05-05', categoryId: '2' },
    ],
  },
];

// Mock Products
export const products: Product[] = [
  { id: '1', name: 'Arroz', brand: 'Camil', unit: 'kg', lastPrice: 20.99, category: 'Alimentos' },
  { id: '2', name: 'Feijão', brand: 'Kicaldo', unit: 'kg', lastPrice: 8.99, category: 'Alimentos' },
  { id: '3', name: 'Leite', brand: 'Piracanjuba', unit: 'l', lastPrice: 4.99, category: 'Laticínios' },
  { id: '4', name: 'Sabonete', brand: 'Dove', unit: 'un', lastPrice: 3.99, category: 'Higiene' },
];

// Mock Shopping Lists
export const shoppingLists: ShoppingList[] = [
  {
    id: '1',
    name: 'Supermercado',
    budget: 500,
    user_id: 'mock-user-id',
    items: [
      { id: '1', product_id: '1', list_id: '1', quantity: 2, price: 20.99, checked: false, user_id: 'mock-user-id' },
      { id: '2', product_id: '2', list_id: '1', quantity: 3, price: 8.99, checked: false, user_id: 'mock-user-id' },
      { id: '3', product_id: '3', list_id: '1', quantity: 6, price: 4.99, checked: false, user_id: 'mock-user-id' },
    ],
  },
  {
    id: '2',
    name: 'Farmácia',
    budget: 200,
    user_id: 'mock-user-id',
    items: [
      { id: '4', product_id: '4', list_id: '2', quantity: 2, price: 3.99, checked: false, user_id: 'mock-user-id' },
    ],
  },
];
