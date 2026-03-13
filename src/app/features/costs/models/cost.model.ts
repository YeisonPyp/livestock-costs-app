import { FarmsSimple } from "../../farms/models/farm.model";

// src/app/modules/costs/models/cost.model.ts
export type UUID = string;

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  parent?: number | null;
  parent_name?: string;
  level: number;
  is_movement: boolean;     // can record costs
  is_active: boolean;
  display_name?: string;
  order?: number;
  icon?: string;
  color?: string;
  children?: Category[];    // populated in tree response
  cost_count?: number;
  total_cost?: number;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

// ── Cost ─────────────────────────────────────────────────────────────────────
export interface Cost {
  id: UUID;
  category: UUID;
  category_name?: string;
  category_code?: string;
  category_color?: string;
  farm: UUID;
  date: string;            // YYYY-MM-DD
  amount: string;
  description: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CostDetail {
  id: UUID;
  category: Category;
  farm: FarmsSimple;
  date: string;            // YYYY-MM-DD
  amount: string;
  description: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ── Summary / Report types ────────────────────────────────────────────────────
export interface CostTotals {
  total: number;
  count: number;
  average: number;
  current_year_total: number;
  max: number;
  min: number;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_code?: string;
  category_color?: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  month_label: string;   // "Enero 2025"
  total: number;
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
  category?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  ordering?: string;
}