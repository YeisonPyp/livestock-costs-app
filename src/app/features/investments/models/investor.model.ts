// models/investor.model.ts

import { SaleDecisionType } from './enums';
import { ContractList } from './contract.model';
import { SaleDecisionSummary } from './sale.model';

// ── Listado ────────────────────────────────────────────────────────
export interface InvestorList {
  id: string;
  code: string;
  fullName: string;
  documentNumber: string;
  email: string;
  joinedDate: string;
  isActive: boolean;
  hasActiveContract: boolean;
  totalCattle: number;
  totalCapital: number;
  totalInvestments: number;
}

// ── Detalle ────────────────────────────────────────────────────────
export interface InvestorDetail {
  id: string;
  code: string;
  personId: string;
  fullName: string;
  email: string;
  phone: string;
  documentNumber: string;
  joinedDate: string;
  currentInvestorPercentage: string | null;
  currentOperatorPercentage: string | null;
  notifySales: boolean;
  notifyWeightGains: boolean;
  defaultSaleDecision: SaleDecisionType;
  notes: string;
  userIsActive: boolean;
  isActive: boolean;
  hasActiveContract: boolean;
  totalContracts: number;
  activeContract: ContractList | null;
  latestContract: ContractList | null;
  createdAt: string;
  updatedAt: string;
}

// ── Payloads ───────────────────────────────────────────────────────
export interface CreateInvestorPayload {
  personId: string;
  joinedDate?: string;
  notifySales?: boolean;
  notifyWeightGains?: boolean;
  defaultSaleDecision?: SaleDecisionType;
  notes?: string;
}

export type UpdateInvestorPayload = Partial<Omit<CreateInvestorPayload, 'personId'>>;

export interface DeactivateInvestorPayload {
  force?: boolean;
}

// ── Respuestas de acciones ─────────────────────────────────────────
export interface DeactivateInvestorResult {
  deactivated: boolean;
  requiresForce: boolean;
  warnings: string[];
}

export interface DeactivationStatus {
  canDeactivate: boolean;
  blocking: string[];
  warnings: string[];
  requiresForce: boolean;
}

// ── Resumen ────────────────────────────────────────────────────────
export interface InvestorSummary {
  investor: {
    id: string;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    documentNumber: string;
    joinedDate: string;
    isActive: boolean;
    hasActiveContract: boolean;
    totalContracts: number;
  };
  investments: {
    count: number;
    totalCapital: string;
    totalContributions: string;
    totalWithdrawals: string;
    totalProfits: string;
  };
  cattle: {
    totalHeads: number;
    totalValue: string;
    totalWeight: string;
    averageWeight: string;
  };
  pendingDecisions: number;
  decisiondList: SaleDecisionSummary[];
  movementsList: StatementMovement[];
}

// ── Estado de cuenta ───────────────────────────────────────────────
export interface StatementMovement {
  date: string;
  type: string;
  description: string;
  amount: string;
  balance: string;
  isCredit: boolean;
}

export interface InvestorStatement {
  investor: { code: string; name: string };
  period: { start: string | null; end: string | null };
  movements: StatementMovement[];
  periodTotals: {
    contributions: string;
    withdrawals: string;
    profits: string;
    costs: string;
  };
  currentBalance: string;
}

// ── Filtros ────────────────────────────────────────────────────────
export interface InvestorFilters {
  search?: string;
  isActive?: boolean;
  personId?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

export interface InvestorSummaryParams {
  includeDecisions?: boolean;
  includeMovements?: boolean;
  includeCattle?: boolean;
}

export interface StatementParams {
  dateFrom?: string;
  dateTo?: string;
}