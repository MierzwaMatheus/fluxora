export const CATEGORIES = {
  income: {
    salario: "Salário",
    freelance: "Freelance",
    beneficio: "Benefício",
    presente: "Presente",
    aluguel: "Aluguel",
    dividendos: "Dividendos",
    investimentos: "Investimentos",
    outros_ganhos: "Outros Ganhos"
  },
  expense: {
    moradia: "Moradia",
    alimentacao: "Alimentação",
    transporte: "Transporte",
    saude: "Saúde",
    educacao: "Educação",
    lazer: "Lazer",
    vestuario: "Vestuário",
    contas: "Contas",
    credito: "Crédito",
    pets: "Pets",
    viagens: "Viagens",
    tecnologia: "Tecnologia",
    beleza: "Beleza",
    esportes: "Esportes",
    cultura: "Cultura",
    presentes: "Presentes",
    doacoes: "Doações",
    seguros: "Seguros",
    impostos: "Impostos",
    investimentos: "Investimentos",
    outros_gastos: "Outros Gastos"
  }
} as const;

export const SHOPPING_CATEGORIES = {
  laticinios: "Laticínios",
  carnes: "Carnes",
  graos: "Grãos",
  bebidas: "Bebidas",
  hortifruti: "Hortifruti",
  padaria: "Padaria",
  higiene: "Higiene",
  limpeza: "Limpeza",
  outros: "Outros",
  bebidas_alcoolicas: "Bebidas Alcoólicas",
  bebidas_nao_alcoolicas: "Bebidas Não Alcoólicas",
  carnes_bovinas: "Carnes Bovinas",
  carnes_suinas: "Carnes Suínas",
  carnes_aves: "Aves",
  carnes_peixes: "Peixes",
  carnes_frios: "Frios",
  massas_frescas: "Massas Frescas",
  massas_secas: "Massas Secas",
  graos_cereais: "Cereais",
  graos_leguminosas: "Leguminosas",
  hortifruti_verduras: "Verduras",
  hortifruti_legumes: "Legumes",
  hortifruti_frutas: "Frutas",
  padaria_paes: "Pães",
  padaria_bolos: "Bolos",
  padaria_salgados: "Salgados",
  laticinios_leites: "Leites",
  laticinios_queijos: "Queijos",
  laticinios_iogurtes: "Iogurtes",
  laticinios_manteigas: "Manteigas",
  higiene_pessoal: "Higiene Pessoal",
  higiene_bucal: "Higiene Bucal",
  limpeza_roupas: "Limpeza de Roupas",
  limpeza_casa: "Limpeza da Casa",
  limpeza_cozinha: "Limpeza da Cozinha",
  pet_shop: "Pet Shop",
  bebes: "Bebês",
  congelados: "Congelados",
  enlatados: "Enlatados",
  temperos: "Temperos",
  doces: "Doces",
  snacks: "Snacks",
  cafe: "Café",
  chas: "Chás",
  suplementos: "Suplementos",
  medicamentos: "Medicamentos"
} as const;

export type IncomeCategory = keyof typeof CATEGORIES.income;
export type ExpenseCategory = keyof typeof CATEGORIES.expense;
export type Category = IncomeCategory | ExpenseCategory;
export type ShoppingCategory = keyof typeof SHOPPING_CATEGORIES;

export function formatCategory(category: string): string {
  const allCategories = { ...CATEGORIES.income, ...CATEGORIES.expense };
  return allCategories[category as Category] || category;
}

export function formatShoppingCategory(category: string): string {
  return SHOPPING_CATEGORIES[category as ShoppingCategory] || category;
}

export function getShoppingCategoryOptions() {
  return Object.entries(SHOPPING_CATEGORIES).map(([value, label]) => ({
    value,
    label
  }));
}

export function getTransactionCategoryOptions() {
  const incomeOptions = Object.entries(CATEGORIES.income).map(([value, label]) => ({
    value,
    label,
    group: "Receitas"
  }));

  const expenseOptions = Object.entries(CATEGORIES.expense).map(([value, label]) => ({
    value,
    label,
    group: "Despesas"
  }));

  return [...incomeOptions, ...expenseOptions];
} 