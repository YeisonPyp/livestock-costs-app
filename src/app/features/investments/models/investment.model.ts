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

// ── Interfaces ────────────────────────────────────────────────────────────────
// export interface Investor {
//   id: string;
//   code: string;
//   person: string;
//   full_name: string;
//   document_number: string;
//   email: string;
//   phone: string | null;
//   joined_date: string;
//   investor_percentage: string;
//   operator_percentage: string;
//   notify_sales: boolean;
//   notify_weight_gains: boolean;
//   default_sale_decision: string;
//   notes: string;
//   is_active: boolean;
//   has_active_contract: boolean;
//   total_investments?: number;
//   total_contracts: number;
//   updated_at: string;
//   total_capital?: number;
//   total_cattle?: number;
//   created_at: string;
// }

// export interface Investment {
//   id: string;
//   investor: string;
//   investor_code?: string;
//   investor_name?: string;
//   investor_document_number?: string;
//   initial_capital: number;
//   current_capital: number;
//   start_date: string;
//   end_date?: string;
//   status: string;
//   status_display?: string;
//   total_contributions: number;
//   total_withdrawals: number;
//   total_profits: number;
//   cattle_count?: number;
//   cattle_value?: number;
//   roi: number;
//   notes?: string;
//   created_at: string;
//   updated_at: string;
// }

// export interface CattleOwnership {
//   id: string;
//   investment: string;
//   investor_code?: string;
//   investor_name?: string;
//   ownership_type: string;
//   ownership_type_display?: string;
//   animal?: string;
//   animal_tag?: string;
//   animal_breed: string | null;
//   lot?: string;
//   lot_code?: string;
//   quantity: number;
//   ownership_percentage: string;
//   purchase_value: number;
//   current_value?: number;
//   initial_weight?: number;
//   current_weight?: number;
//   weight_gain?: number;
//   weight_gain_percentage?: number;
//   value_appreciation?: number;
//   value_appreciation_percentage?: number;
//   acquisition_date: string;
//   disposal_date?: string;
//   status: string;
//   notes?: string;
//   created_at: string;
// }

// export interface InvestmentMovement {
//   id: string;
//   investment: string;
//   movement_type: string;
//   movement_type_display?: string;
//   amount: number;
//   balance_after: number;
//   effective_date: string;
//   description: string;
//   reference_type?: string;
//   reference_id?: string;
//   notes?: string;
//   is_credit: boolean;
//   is_debit: boolean;
//   created_by_username: string;
//   created_by_name?: string;
//   created_at: string;
// }

// export interface SaleDecision {
//   id: string;
//   investment_code: string;
//   sale_event_date: string;
//   sale_event_description: string;
//   sale_event: string;
//   sale_description?: string;
//   investment: string;
//   investor_code?: string;
//   investor_name?: string;
//   cattle_ownership: string;
//   investor_amount: number;
//   profit_loss: number;
//   decision_type: string;
//   decision_type_display?: string;
//   reinvest_amount: number;
//   withdraw_amount: number;
//   decision_date?: string;
//   decision_deadline?: string;
//   is_processed: boolean;
//   processed_at?: string;
//   notes?: string;
//   created_at: string;
// }

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


import { AnimalListItem } from '../../cattle/models/cattle.model';

// ═════════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Estados de inversión (sincronizado con InvestmentStatus del backend)
 */
export const INVESTMENT_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  PAUSED: 'paused',
} as const;

export type InvestmentStatus = typeof INVESTMENT_STATUS[keyof typeof INVESTMENT_STATUS];

export const INVESTMENT_STATUS_OPTIONS = [
  { value: INVESTMENT_STATUS.ACTIVE, label: 'Activa', color: 'success', icon: 'trending-up' },
  { value: INVESTMENT_STATUS.CLOSED, label: 'Cerrada', color: 'medium', icon: 'lock-closed' },
  { value: INVESTMENT_STATUS.PAUSED, label: 'Pausada', color: 'warning', icon: 'pause' },
] as const;

/**
 * Tipos de movimiento de capital
 */
export const MOVEMENT_TYPE = {
  CONTRIBUTION: 'contribution',
  WITHDRAWAL: 'withdrawal',
  SALE_PROFIT: 'sale_profit',
  COST_SHARE: 'cost_share',
  DIVIDEND: 'dividend',
  REINVESTMENT: 'reinvestment',
} as const;

export type MovementType = typeof MOVEMENT_TYPE[keyof typeof MOVEMENT_TYPE];

export const MOVEMENT_TYPE_OPTIONS = [
  { 
    value: MOVEMENT_TYPE.CONTRIBUTION, 
    label: 'Aporte', 
    color: 'success', 
    icon: 'arrow-down-circle',
    isCredit: true 
  },
  { 
    value: MOVEMENT_TYPE.WITHDRAWAL, 
    label: 'Retiro', 
    color: 'danger', 
    icon: 'arrow-up-circle',
    isCredit: false 
  },
  { 
    value: MOVEMENT_TYPE.SALE_PROFIT, 
    label: 'Ganancia Venta', 
    color: 'success', 
    icon: 'cash',
    isCredit: true 
  },
  { 
    value: MOVEMENT_TYPE.COST_SHARE, 
    label: 'Cargo Costos', 
    color: 'warning', 
    icon: 'receipt',
    isCredit: false 
  },
  { 
    value: MOVEMENT_TYPE.DIVIDEND, 
    label: 'Dividendo', 
    color: 'info', 
    icon: 'gift',
    isCredit: true 
  },
  { 
    value: MOVEMENT_TYPE.REINVESTMENT, 
    label: 'Reinversión', 
    color: 'primary', 
    icon: 'repeat',
    isCredit: true 
  },
] as const;

/**
 * Tipos de decisión de venta
 */
export const SALE_DECISION_TYPE = {
  PENDING: 'pending',
  REINVEST: 'reinvest',
  WITHDRAW: 'withdraw',
  PARTIAL: 'partial',
  COMMON: 'common', // Corregido de 'comun' a 'common'
} as const;

export type SaleDecisionType = typeof SALE_DECISION_TYPE[keyof typeof SALE_DECISION_TYPE];

export const SALE_DECISION_OPTIONS = [
  { 
    value: SALE_DECISION_TYPE.PENDING, 
    label: 'Pendiente', 
    color: 'medium', 
    icon: 'time' 
  },
  { 
    value: SALE_DECISION_TYPE.REINVEST, 
    label: 'Reinvertir', 
    color: 'success', 
    icon: 'refresh-circle' 
  },
  { 
    value: SALE_DECISION_TYPE.WITHDRAW, 
    label: 'Retirar', 
    color: 'danger', 
    icon: 'cash-outline' 
  },
  { 
    value: SALE_DECISION_TYPE.PARTIAL, 
    label: 'Parcial', 
    color: 'warning', 
    icon: 'git-compare' 
  },
  { 
    value: SALE_DECISION_TYPE.COMMON, 
    label: 'Común', 
    color: 'info', 
    icon: 'people' 
  },
] as const;

/**
 * Estados de propiedad de ganado
 */
export const CATTLE_OWNERSHIP_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  TRANSFERRED: 'transferred',
  DECEASED: 'deceased',
} as const;

export type CattleOwnershipStatus = typeof CATTLE_OWNERSHIP_STATUS[keyof typeof CATTLE_OWNERSHIP_STATUS];

export const CATTLE_OWNERSHIP_STATUS_OPTIONS = [
  { 
    value: CATTLE_OWNERSHIP_STATUS.ACTIVE, 
    label: 'Activo', 
    color: 'success', 
    icon: 'checkmark-circle' 
  },
  { 
    value: CATTLE_OWNERSHIP_STATUS.SOLD, 
    label: 'Vendido', 
    color: 'info', 
    icon: 'cash' 
  },
  { 
    value: CATTLE_OWNERSHIP_STATUS.TRANSFERRED, 
    label: 'Transferido', 
    color: 'warning', 
    icon: 'swap-horizontal' 
  },
  { 
    value: CATTLE_OWNERSHIP_STATUS.DECEASED, 
    label: 'Fallecido', 
    color: 'danger', 
    icon: 'skull' 
  },
] as const;

/**
 * Tipos de propiedad
 */
export const OWNERSHIP_TYPE = {
  INDIVIDUAL: 'individual',
  LOT: 'lot',
  PERCENTAGE: 'percentage',
} as const;

export type OwnershipType = typeof OWNERSHIP_TYPE[keyof typeof OWNERSHIP_TYPE];

export const OWNERSHIP_TYPE_OPTIONS = [
  { 
    value: OWNERSHIP_TYPE.INDIVIDUAL, 
    label: 'Animal individual', 
    icon: 'medical' 
  },
  { 
    value: OWNERSHIP_TYPE.LOT, 
    label: 'Lote completo', 
    icon: 'grid' 
  },
  { 
    value: OWNERSHIP_TYPE.PERCENTAGE, 
    label: 'Porcentaje de lote', 
    icon: 'pie-chart' 
  },
] as const;

// ═════════════════════════════════════════════════════════════════════════════
// INTERFACES PRINCIPALES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Inversionista
 */
export interface Investor {
  id: string;
  code: string;
  person: string;
  full_name: string;
  document_number: string;
  email: string;
  phone: string | null;
  joined_date: string; // ISO date
  investor_percentage: string; // Decimal as string
  operator_percentage: string;  // Decimal as string
  notify_sales: boolean;
  notify_weight_gains: boolean;
  default_sale_decision: SaleDecisionType;
  notes: string;
  is_active: boolean;
  has_active_contract: boolean;
  total_contracts: number;
  
  // Campos calculados (solo en listados o detail)
  total_investments?: number;
  total_capital?: string; // Decimal as string
  total_cattle?: number;
  
  // Timestamps
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/**
 * Inversión
 */
export interface Investment {
  id: string;
  investor: string; // UUID del investor
  
  // Datos del inversionista (desnormalizados en listado)
  investor_code?: string;
  investor_name?: string;
  investor_id?: string;
  
  // Capital
  initial_capital: string; // Decimal as string
  current_capital: string;
  total_contributions: string;
  total_withdrawals: string;
  total_profits: string;
  total_costs?: string; // Agregado según backend
  
  // Fechas
  start_date: string; // ISO date
  end_date: string | null;
  
  // Estado
  status: InvestmentStatus;
  status_display?: string;
  
  // Métricas calculadas
  roi?: string; // Decimal as string (%)
  net_profit?: string; // total_profits - total_costs
  cattle_count?: number;
  cattle_purchase_value?: string;
  
  // Validaciones de cierre
  can_close?: boolean;
  has_active_cattle?: boolean;
  has_pending_decisions?: boolean;
  
  notes: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Detalle de inversión con estadísticas
 */
export interface InvestmentDetail extends Investment {
  cattle_stats: {
    count: number;
    total_purchase_value: string;
    distinct_animals: number;
    distinct_lots: number;
  };
}

/**
 * Propiedad de ganado
 */
export interface CattleOwnership {
  id: string;
  investment: string; // UUID
  
  // Datos del inversionista (desnormalizados)
  investor_code?: string;
  investor_name?: string;
  
  // Tipo de propiedad
  ownership_type: OwnershipType;
  ownership_type_display?: string;
  ownership_percentage: string; // Decimal (0-100)
  quantity: number;
  
  // Animal individual
  animal: string | null; // UUID
  animal_tag?: string;
  animal_breed?: string | null;
  
  // Lote
  lot: string | null; // UUID
  lot_code?: string;
  
  // Valores financieros
  purchase_value: string; // Decimal
  current_value?: string; // Calculado
  
  // Peso
  initial_weight: string | null; // Decimal
  current_weight?: string; // Calculado
  weight_gain?: string;
  weight_gain_percentage?: string;
  
  // Apreciación
  value_appreciation?: string;
  value_appreciation_percentage?: string;
  
  // Fechas
  acquisition_date: string; // ISO date
  disposal_date: string | null;
  
  // Estado
  status: CattleOwnershipStatus;
  status_display?: string;
  
  notes: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Movimiento de capital
 */
export interface InvestmentMovement {
  id: string;
  investment: string; // UUID
  
  // Tipo de movimiento
  movement_type: MovementType;
  movement_type_display?: string;
  
  // Montos
  amount: string; // Decimal
  balance_after: string; // Decimal
  
  // Fecha efectiva
  effective_date: string; // ISO date
  
  // Descripción
  description: string;
  notes: string;
  
  // Trazabilidad genérica
  reference_type: string; // 'sale_decision', 'cost', etc.
  reference_id: string | null; // UUID
  
  // Clasificación
  is_credit: boolean;
  
  // Usuario que creó
  created_by: string; // UUID
  created_by_name?: string;
  
  // Timestamps
  created_at: string;
}

/**
 * Decisión de venta
 */
export interface SaleDecision {
  id: string;
  sale_event: string; // UUID
  investment: string; // UUID
  
  // Datos desnormalizados
  investor_code?: string;
  investor_name?: string;
  sale_event_date?: string;
  sale_event_description?: string;
  investment_code?: string;
  
  // Montos
  investor_amount: string; // Decimal - monto que le corresponde
  profit_loss: string; // Decimal - ganancia o pérdida
  
  // Decisión
  decision_type: SaleDecisionType;
  decision_type_display?: string;
  reinvest_amount: string; // Decimal
  withdraw_amount: string; // Decimal
  
  // Fechas
  decision_date: string | null; // ISO datetime
  decision_deadline: string | null; // ISO datetime
  
  // Estado de procesamiento
  is_processed: boolean;
  processed_at: string | null; // ISO datetime
  
  notes: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

/**
 * Evento de venta
 */
// export interface SaleEvent {
//   id: string;
  
//   // Datos básicos
//   sale_date: string; // ISO date
//   description: string;
  
//   // Comprador (opcional)
//   buyer: string | null; // UUID
//   buyer_name?: string;
  
//   // Totales
//   total_heads: number;
//   total_weight: string; // Decimal
//   price_per_kg: string; // Decimal (promedio)
//   gross_amount: string; // Decimal
//   sale_costs: string; // Decimal
//   net_amount: string; // Decimal (calculado)
  
//   // Estado
//   is_finalized: boolean;
//   finalized_at: string | null; // ISO datetime
  
//   // Evidencia
//   has_evidence: boolean;
//   evidence_file?: string | null; // URL
  
//   // Estadísticas
//   pending_decisions_count?: number;
//   all_decisions_made?: boolean;
  
//   notes: string;
  
//   // Auditoría
//   created_by: string; // UUID
//   created_by_name?: string;
  
//   // Timestamps
//   created_at: string;
//   updated_at?: string;
// }

/**
 * Item individual dentro de un evento de venta
 */
export interface SaleEventItem {
  id: string;
  sale_event: string; // UUID
  animal: string; // UUID
  cattle_ownership: string; // UUID
  
  // Datos del animal (desnormalizados)
  animal_tag?: string;
  
  // Valores
  weight: string; // Decimal
  price_per_kg: string; // Decimal
  gross_amount: string; // Decimal (weight × price_per_kg)
  
  // Timestamps
  created_at: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// RESÚMENES Y REPORTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resumen detallado de un inversionista
 */
// export interface InvestorSummary {
//   investor: {
//     id: string;
//     code: string;
//     name: string;
//     email: string;
//     phone: string | null;
//     document_number: string;
//     joined_date: string;
//     is_active: boolean;
//     has_active_contract: boolean;
//     total_contracts: number;
//   };
  
//   investments: {
//     count: number;
//     capital_initial: string; // Decimal
//     total_capital: string;
//     total_contributions: string;
//     total_withdrawals: string;
//     total_profits: string;
//     total_costs: string;
//     roi_percentage: string; // Decimal
//   };
  
//   cattle: {
//     total_heads: number;
//     total_value: string; // Decimal
//     total_weight: string; // Decimal
//     average_weight: string; // Decimal
//   };
  
//   pending_decisions: number;
  
//   // Listas opcionales (si se incluyen en la respuesta)
//   decisions_list?: SaleDecision[];
//   movements_list?: InvestmentMovement[];
//   cattle_list?: AnimalListItem[];
// }

/**
 * Estado de cuenta de un inversionista
 */
// export interface InvestorStatement {
//   investor: {
//     id: string;
//     code: string;
//     full_name: string;
//   };
  
//   period: {
//     start: string; // ISO date
//     end: string; // ISO date
//   };
  
//   opening_balance: string; // Decimal
//   closing_balance: string; // Decimal
  
//   movements: InvestmentMovement[];
  
//   summary: {
//     total_contributions: string;
//     total_withdrawals: string;
//     total_profits: string;
//     total_costs: string;
//     net_change: string;
//   };
// }

// /**
//  * Reporte de participación (dashboard global)
//  */
// export interface ParticipationReport {
//   investor_code: string;
//   investor_name: string;
//   total_capital: string;
//   cattle_count: number;
//   cattle_value: string;
//   total_profits: string;
//   roi_percentage: string;
//   pending_decisions: number;
// }

/**
 * Dashboard de inversión individual
 */
export interface InvestmentDashboard {
  financial: {
    initial_capital: string;
    current_capital: string;
    total_contributions: string;
    total_withdrawals: string;
    total_profits: string;
    total_costs: string;
    net_profit: string;
    roi: string;
  };
  
  cattle: {
    count: number;
    total_purchase_value: string;
    distinct_animals: number;
    distinct_lots: number;
  };
  
  movements_by_type: Record<MovementType, string>; // { contribution: "5000.00", ... }
  
  recent_movements: Array<{
    id: string;
    movement_type: MovementType;
    amount: string;
    balance_after: string;
    effective_date: string;
    description: string;
  }>;
  
  monthly_evolution: Array<{
    month: string; // ISO date (primer día del mes)
    contributions: string;
    withdrawals: string;
    profits: string;
    costs: string;
  }>;
}

/**
 * Estado de cierre de inversión
 */
export interface ClosureStatus {
  can_close: boolean;
  blocking: string[]; // Razones que impiden el cierre
  summary: {
    active_cattle: number;
    pending_decisions: number;
    current_balance: string;
  };
}

/**
 * Resumen global de todas las inversiones
 */
export interface GlobalSummary {
  total_invested: string;
  total_current_capital: string;
  total_profits: string;
  total_costs: string;
  active_count: number;
  closed_count: number;
  total_closed_capital: string;
  avg_roi: string | null; // Puede ser null si no hay inversiones
}

/**
 * Evolución del capital (mensual)
 */
export interface CapitalEvolution {
  month: string; // ISO date
  contributions: string;
  withdrawals: string;
  profits: string;
  costs: string;
  movements_count: number;
}

/**
 * Ranking de inversionistas
 */
export interface InvestorRanking {
  investor__code: string;
  investor__person__first_name: string;
  investor__person__last_name: string;
  initial_capital: string;
  current_capital: string;
  total_profits: string;
  total_costs: string;
}

/**
 * Acciones pendientes (para dashboard administrativo)
 */
export interface PendingActions {
  pending_decisions: number;
  expiring_contracts: number;
  investments_needing_attention: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYLOADS (para peticiones POST/PUT)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Crear inversión
 */
export interface CreateInvestmentPayload {
  investor_id: string;
  initial_capital: number | string; // Acepta ambos, el backend valida
  start_date?: string; // ISO date, opcional
  notes?: string;
}

/**
 * Aporte de capital
 */
export interface ContributePayload {
  amount: number | string;
  effective_date?: string; // ISO date
  description?: string;
}

/**
 * Retiro de capital
 */
export interface WithdrawPayload {
  amount: number | string;
  effective_date?: string; // ISO date
  description?: string;
}

/**
 * Tomar decisión de venta
 */
// export interface MakeDecisionPayload {
//   decision_type: 'reinvest' | 'withdraw' | 'partial';
//   reinvest_amount?: number | string; // Requerido si es 'partial'
//   withdraw_amount?: number | string; // Requerido si es 'partial'
// }

// /**
//  * Crear evento de venta
//  */
export interface CreateSaleEventPayload {
  sale_date: string; // ISO date
  description: string;
  buyer_id?: string; // UUID, opcional
  sale_costs?: number | string;
  items: Array<{
    animal_id: string; // UUID
    weight: number | string;
    price_per_kg: number | string;
  }>;
}

/**
 * Asignar ganado a inversión
 */
export interface AssignCattlePayload {
  investment_id: string;
  ownership_type: OwnershipType;
  animal_id?: string; // Requerido si ownership_type = 'individual'
  lot_id?: string; // Requerido si ownership_type = 'lot' o 'percentage'
  quantity?: number; // Requerido para lotes
  ownership_percentage?: number; // Requerido si ownership_type = 'percentage'
  purchase_value: number | string;
  initial_weight?: number | string;
  acquisition_date?: string; // ISO date
  notes?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS / UTILIDADES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene la configuración de un tipo de movimiento
 */
export function getMovementTypeConfig(type: MovementType) {
  return MOVEMENT_TYPE_OPTIONS.find(opt => opt.value === type);
}

/**
 * Obtiene la configuración de un estado de inversión
 */
export function getInvestmentStatusConfig(status: InvestmentStatus) {
  return INVESTMENT_STATUS_OPTIONS.find(opt => opt.value === status);
}

/**
 * Obtiene la configuración de un tipo de decisión
 */
export function getSaleDecisionConfig(type: SaleDecisionType) {
  return SALE_DECISION_OPTIONS.find(opt => opt.value === type);
}

/**
 * Obtiene la configuración de un estado de propiedad
 */
export function getCattleOwnershipStatusConfig(status: CattleOwnershipStatus) {
  return CATTLE_OWNERSHIP_STATUS_OPTIONS.find(opt => opt.value === status);
}

/**
 * Verifica si un movimiento es crédito (aumenta el balance)
 */
export function isCredit(movementType: MovementType): boolean {
  const config = getMovementTypeConfig(movementType);
  return config?.isCredit ?? false;
}

/**
 * Formatea un decimal string a número con separadores
 */
export function formatDecimal(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea un valor monetario
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${formatDecimal(num, decimals)}%`;
}

/**
 * Valida si una inversión puede cerrarse
 */
export function canCloseInvestment(investment: Investment | InvestmentDetail): boolean {
  if (investment.status !== INVESTMENT_STATUS.ACTIVE) return false;
  if (investment.has_active_cattle) return false;
  if (investment.has_pending_decisions) return false;
  if (parseFloat(investment.current_capital) !== 0) return false;
  return true;
}

/**
 * Calcula el balance neto de movimientos
 */
export function calculateNetBalance(movements: InvestmentMovement[]): number {
  return movements.reduce((acc, mov) => {
    const amount = parseFloat(mov.amount);
    return mov.is_credit ? acc + amount : acc - amount;
  }, 0);
}

/**
 * Agrupa movimientos por tipo
 */
export function groupMovementsByType(
  movements: InvestmentMovement[]
): Record<MovementType, InvestmentMovement[]> {
  return movements.reduce((acc, mov) => {
    if (!acc[mov.movement_type]) {
      acc[mov.movement_type] = [];
    }
    acc[mov.movement_type].push(mov);
    return acc;
  }, {} as Record<MovementType, InvestmentMovement[]>);
}