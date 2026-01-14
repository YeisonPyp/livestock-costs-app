export interface Cost {
  id: number;
  category: number;
  category_name: string;
  date_incurred: string;
  description: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface CostCreate {
  category: number;
  date_incurred: string;
  description: string;
  amount: string | number;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}
