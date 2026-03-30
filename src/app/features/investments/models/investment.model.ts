// src/app/modules/investments/models/investment.model.ts

// ── Enums / constants ─────────────────────────────────────────────────────────
export const INVESTMENT_STATUS = [
  { value: 'active',   label: 'Activa' },
  { value: 'closed',   label: 'Cerrada' },
  { value: 'paused',   label: 'Pausada' },
];

export const MOVEMENT_TYPES = [
  { value: 'contribution', label: 'Aporte',         color: 'success' },
  { value: 'withdrawal',   label: 'Retiro',          color: 'danger'  },
  { value: 'reinvestment', label: 'Reinversión',     color: 'info'    },
  { value: 'sale_profit',  label: 'Ganancia de Venta',color: 'success'},
  { value: 'dividend',     label: 'Dividendo',       color: 'success' },
  { value: 'cost_share',   label: 'Cargo de Costo',  color: 'warning' },
];

export const SALE_DECISION_TYPES = [
  { value: 'pending',    label: 'Pendiente'  },
  { value: 'reinvest',   label: 'Reinvertir' },
  { value: 'withdraw',   label: 'Retirar'    },
  { value: 'partial',    label: 'Parcial'    },
  { value: 'comun',    label: 'Comun'    },
];

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
  email?: string;
  phone?: string;
  joined_date: string;
  investor_percentage: number;
  operator_percentage: number;
  is_active: boolean;
  notify_sales: boolean;
  default_sale_decision: string;
  notes?: string;
  // computed (from summary)
  total_investments?: number;
  total_capital?: number;
  total_cattle?: number;
  created_at: string;
}

export interface InvestorSummary {
  investor: {
    id: string;
    code: string;
    full_name: string;
    email: string;
    joined_date: string;
    is_active: boolean;
  };
  capital: {
    initial: number;
    current: number;
    total_contributions: number;
    total_withdrawals: number;
    total_profits: number;
    roi_percentage: number;
  };
  cattle: {
    count: number;
    total_value: number;
    total_weight: number;
  };
  investments: {
    total: number;
    active: number;
    closed: number;
  };
  pending_decisions: number;
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
  roi?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  created_by_name?: string;
  created_at: string;
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
  lot?: string;
  lot_code?: string;
  quantity: number;
  ownership_percentage: number;
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


export interface SaleDecision {
  id: string;
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