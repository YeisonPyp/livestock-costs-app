import { FarmsSimple } from "../../farms/models/farm.model";
import { UUID } from "../../../core/models/api-response.model"


export type CategoryType = 'expense' | 'income';
export type CostType = 'fixed' | 'variable';

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  parent?: number | null;
  parent_name?: string;
  level: number;
  full_name: string;
  cost_type: CostType;
  category_type: CategoryType;
  is_movement: boolean; 
  has_children: boolean;
  has_entries: boolean;
  is_active: boolean;
  display_name?: string;
  children?: Category[];
  cost_count?: number;
  total_cost?: number;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

// ── Cost ─────────────────────────────────────────────────────────────────────
export interface Cost {
  id: UUID;
  date: string; 
  description: string;
  category: UUID;
  category_code?: string;
  category_name?: string;
  farm: UUID;
  farm_code?: string;
  farm_name?: string;
  amount: string;
  signed_amount: string;
  movement_type: CategoryType;
  is_income: boolean;
  is_expense: boolean;
  payment_status: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CostDetail {
  id: UUID;
  date: string; 
  category: Category;
  farm: FarmsSimple;
  description: string;
  amount: string;
  signed_amount: string;
  movement_type: CategoryType;
  is_income: boolean;
  is_expense: boolean;
  payment_status: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ── Summary / Report types ────────────────────────────────────────────────────
export interface CostTotals {
  gross_total: string;
  income_total: string;
  expense_total: string;
  balance: string;
  count: number;
  average: string;
  current_year_total: string;
  fixed_costs: string;
  variable_costs: string;
  max: string;
  min: string;
}

export interface CategorySummary {
  category_id: UUID;
  category_code?: string;
  category_name: string;
  parent_name?: string;
  category_type: CategoryType;
  income_total: string;
  expense_total: string;
  balance: string;
  count: number;
  percentage: string;
}

export interface MonthlySummary {
  month: number;
  month_name: string;
  year: number;
  income_total: string;
  expense_total: string;
  balance: string;
  count: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  month_label: string;
  total: number;
  categories: MonthlyReportCategory[];
}

export interface MonthlyReportCategory {
  id: number;
  code: string;
  name: string;
  color?: string;
  total: number;
  count: number;
  percentage: number;
  children?: MonthlyReportCategory[];
}

export interface YearToDate {
  year: number;
  total: number;
  count: number;
  by_month: MonthlySummary[];
}

// ── Filter params ─────────────────────────────────────────────────────────────
export interface CostFilters {
  farm_id?: string;
  // category?: string;
  page?: number;
  page_size?: number;
  category?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  ordering?: string;
}