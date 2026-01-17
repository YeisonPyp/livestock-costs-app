export interface MonthlyTotal {
  year: number;
  month: number;
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}


/**
 * Interface para la entidad Costo
 */
export interface Cost {
  id: number;
  category: number;
  category_name?: string; // Incluido por el backend en algunos endpoints
  date_incurred: string; // Formato: 'YYYY-MM-DD'
  amount: number;
  description: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

/**
 * DTO para crear un nuevo costo
 */
export interface CreateCostDto {
  category: number;
  date_incurred: string;
  amount: number;
  description: string;
  notes?: string;
}

/**
 * DTO para actualizar un costo existente
 */
export interface UpdateCostDto {
  category?: number;
  date_incurred?: string;
  amount?: number;
  description?: string;
  notes?: string;
}

/**
 * Interface para el resumen de costos
 */
export interface CostSummary {
  total_amount: number;
  count: number;
  average_amount: number;
  max_amount: number;
  min_amount: number;
  by_category?: {
    category_id: number;
    category_name: string;
    total: number;
    count: number;
  }[];
  by_month?: {
    month: string;
    total: number;
    count: number;
  }[];
}