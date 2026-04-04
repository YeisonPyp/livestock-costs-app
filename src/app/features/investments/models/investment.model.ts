// src/app/modules/investments/models/investment.model.ts

import { AnimalListItem } from "../../cattle/models/cattle.model";

// ── Enums / constants ─────────────────────────────────────────────────────────
export const INVESTMENT_STATUS = [
  { value: 'active',   label: 'Activa' },
  { value: 'closed',   label: 'Cerrada' },
  { value: 'paused',   label: 'Pausada' },
];

export const MOVEMENT_TYPES = [
  { value: 'contribution',  label: 'Aporte',          color: 'success' },
  { value: 'withdrawal',    label: 'Retiro',          color: 'danger' },
  { value: 'sale_profit',   label: 'Ganancia Venta',  color: 'success' },
  { value: 'cost_share',    label: 'Cargo Costos',    color: 'warning' },
  { value: 'dividend',      label: 'Dividendo',       color: 'info' },
  { value: 'reinvestment',  label: 'Reinversión',     color: 'primary' },
] as const;

export const SALE_DECISION_TYPES = [
  { value: 'pending',   label: 'Pendiente',   color: 'secondary' },
  { value: 'reinvest',  label: 'Reinvertir',  color: 'success' },
  { value: 'withdraw',  label: 'Retirar',     color: 'danger' },
  { value: 'partial',   label: 'Parcial',     color: 'warning' },
  { value: 'comun',     label: 'Comun',       color: 'info' },
] as const;

export const OWNERSHIP_STATUS = [
  { value: 'active',      label: 'Activo',      color: 'success' },
  { value: 'sold',        label: 'Vendido',     color: 'info' },
  { value: 'transferred', label: 'Transferido', color: 'warning' },
  { value: 'deceased',    label: 'Fallecido',   color: 'danger' },
] as const;


export const OWNERSHIP_TYPES = [
  { value: 'individual', label: 'Animal individual' },
  { value: 'lot',        label: 'Lote completo'     },
  { value: 'percentage', label: 'Porcentaje de lote'},
];

export const CATTLE_OWNERSHIP_STATUS = [
  { value: 'active',   label: 'Activo'   },
  { value: 'sold',     label: 'Vendido'  },
  { value: 'disposed', label: 'Dispuesto'},
];

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface Investor {
  id: string;
  code: string;
  person: string;
  full_name: string;
  document_number: string;
  email: string;
  phone: string | null;
  joined_date: string;
  investor_percentage: string;
  operator_percentage: string;
  notify_sales: boolean;
  notify_weight_gains: boolean;
  default_sale_decision: string;
  notes: string;
  is_active: boolean;
  has_active_contract: boolean;
  total_investments?: number;
  total_contracts: number;
  updated_at: string;
  total_capital?: number;
  total_cattle?: number;
  created_at: string;
}

export interface Investment {
  id: string;
  investor: string;
  investor_code?: string;
  investor_name?: string;
  investor_document_number?: string;
  initial_capital: number;
  current_capital: number;
  start_date: string;
  end_date?: string;
  status: string;
  status_display?: string;
  total_contributions: number;
  total_withdrawals: number;
  total_profits: number;
  cattle_count?: number;
  cattle_value?: number;
  roi: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CattleOwnership {
  id: string;
  investment: string;
  investor_code?: string;
  investor_name?: string;
  ownership_type: string;
  ownership_type_display?: string;
  animal?: string;
  animal_tag?: string;
  animal_breed: string | null;
  lot?: string;
  lot_code?: string;
  quantity: number;
  ownership_percentage: string;
  purchase_value: number;
  current_value?: number;
  initial_weight?: number;
  current_weight?: number;
  weight_gain?: number;
  weight_gain_percentage?: number;
  value_appreciation?: number;
  value_appreciation_percentage?: number;
  acquisition_date: string;
  disposal_date?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface InvestmentMovement {
  id: string;
  investment: string;
  movement_type: string;
  movement_type_display?: string;
  amount: number;
  balance_after: number;
  effective_date: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  is_credit: boolean;
  is_debit: boolean;
  created_by_username: string;
  created_by_name?: string;
  created_at: string;
}

export interface SaleDecision {
  id: string;
  investment_code: string;
  sale_event_date: string;
  sale_event_description: string;
  sale_event: string;
  sale_description?: string;
  investment: string;
  investor_code?: string;
  investor_name?: string;
  cattle_ownership: string;
  investor_amount: number;
  profit_loss: number;
  decision_type: string;
  decision_type_display?: string;
  reinvest_amount: number;
  withdraw_amount: number;
  decision_date?: string;
  decision_deadline?: string;
  is_processed: boolean;
  processed_at?: string;
  notes?: string;
  created_at: string;
}

// ────────────────────────────────────────────
// SUMMARY (respuesta del endpoint)
// ────────────────────────────────────────────

export interface InvestorSummaryInvestor {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  document_number: string;
  joined_date: string;
  is_active: boolean;
  has_active_contract: boolean;
  total_contracts: number;
}

export interface InvestorSummaryInvestments {
  count: number;
  capital_initial: number;
  total_capital: number;
  total_contributions: number;
  total_withdrawals: number;
  total_profits: number;
  roi_percentage: number;
}

export interface InvestorSummaryCattle {
  total_heads: number;
  total_value: number;
  total_weight: number;
  average_weight: number;
}

export interface InvestorSummary {
  investor: InvestorSummaryInvestor;
  investments: InvestorSummaryInvestments;
  cattle: InvestorSummaryCattle;
  pending_decisions: number;
  // Listas opcionales
  decisions_list?: SaleDecision[];
  movements_list?: InvestmentMovement[];
  cattle_list?: AnimalListItem[];
}


export interface InvestorStatement {
  investor: { id: string; code: string; full_name: string };
  period: { start: string; end: string };
  opening_balance: number;
  closing_balance: number;
  movements: InvestmentMovement[];
  summary: {
    total_contributions: number;
    total_withdrawals: number;
    total_profits: number;
    net_change: number;
  };
}

export interface SaleEvent {
  id: string;
  sale_date: string;
  description: string;
  buyer_name?: string;
  total_heads: number;
  total_weight: number;
  price_per_kg: number;
  gross_amount: number;
  sale_costs: number;
  net_amount: number;
  is_finalized: boolean;
  finalized_at?: string;
  pending_decisions_count?: number;
  all_decisions_made?: boolean;
  notes?: string;
  created_at: string;
}

export interface SaleEventCreate {
  sale_date: string;
  description: string;
  buyer_id?: string;
  sale_costs?: number;
  items: {
    animal_id: string;
    weight: number;
    price_per_kg: number;
  }[];
}

export interface ParticipationReport {
  investor_code: string;
  investor_name: string;
  total_capital: number;
  cattle_count: number;
  cattle_value: number;
  total_profits: number;
  roi_percentage: number;
  pending_decisions: number;
}

export interface ContributeWithdrawPayload {
  amount: number;
  description?: string;
  effective_date?: string;
}

export interface MakeDecisionPayload {
  decision_type: 'reinvest' | 'withdraw' | 'partial';
  reinvest_amount?: number;
  withdraw_amount?: number;
}