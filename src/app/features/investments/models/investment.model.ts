// models/investment.model.ts

import { InvestmentStatus, InvestmentMovementType } from './enums';

// ── Cattle stats (reutilizado en varios contextos) ─────────────────
export interface CattleStats {
  totalHeads: number;
  totalValue: string;
  totalWeight: string;
  averageWeight: string;
  activeCount: number;
}

// ── Listado ────────────────────────────────────────────────────────
export interface InvestmentList {
  id: string;
  investorCode: string;
  investorName: string;
  initialCapital: string;
  currentCapital: string;
  totalContributions: string;
  totalWithdrawals: string;
  totalProfits: string;
  totalCosts: string;
  status: InvestmentStatus;
  cattleCount: number;
  cattlePurchaseValue: string;
  roi: string;
  netProfit: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

// ── Detalle ────────────────────────────────────────────────────────
export interface InvestmentDetail extends InvestmentList {
  investorId: string;
  cattleStats: CattleStats;
  canClose: boolean;
  notes: string;
  updatedAt: string;
}

// ── Movimiento ─────────────────────────────────────────────────────
export interface InvestmentMovement {
  id: string;
  movementType: InvestmentMovementType;
  movementTypeDisplay: string;
  amount: string;
  balanceAfter: string;
  effectiveDate: string;
  description: string;
  notes: string;
  referenceType: string | null;
  referenceId: string | null;
  isCredit: boolean;
  isDebit: boolean;
  createdByName: string | null;
  createdByUsername: string | null;
  createdAt: string;
}

// ── Dashboard ──────────────────────────────────────────────────────
export interface MonthlyEvolution {
  month: string;
  credits: string;
  debits: string;
  net: string;
}

export interface InvestmentDashboard {
  financial: {
    initialCapital: string;
    currentCapital: string;
    totalContributions: string;
    totalWithdrawals: string;
    totalProfits: string;
    totalCosts: string;
    netProfit: string;
    roi: string;
  };
  cattle: CattleStats;
  movementsByType: Partial<Record<InvestmentMovementType, string>>;
  recentMovements: Partial<InvestmentMovement>[];
  monthlyEvolution: MonthlyEvolution[];
}

// ── Estado de cierre ───────────────────────────────────────────────
export interface ClosureStatus {
  canClose: boolean;
  blocking: string[];
  summary: {
    activeCattle: number;
    pendingDecisions: number;
    currentBalance: string;
  };
}

// ── Global summary ─────────────────────────────────────────────────
export interface GlobalInvestmentSummary {
  totalInvested: number;
  totalCurrentCapital: number;
  totalProfits: number;
  totalCosts: number;
  activeCount: number;
  closedCount: number;
  totalClosedCapital: number;
  avgRoi: number;
}
// ── Payloads ───────────────────────────────────────────────────────
export interface CreateInvestmentPayload {
  investorId: string;
  initialCapital: number;
  startDate?: string;
  notes?: string;
}

export interface ContributionPayload {
  amount: number;
  effectiveDate?: string;
  description?: string;
}

export type WithdrawalPayload = ContributionPayload;

// ── Filtros ────────────────────────────────────────────────────────
export interface InvestmentFilters {
  status?: InvestmentStatus;
  investor?: string;
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

export interface MovementFilters {
  type?: InvestmentMovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ── Reports ────────────────────────────────────────────────────────
export interface ParticipationReport {
  investorCode: string;
  investorName: string;
  totalCapital: string;
  totalCattle: number;
  participationPercentage: string;
}