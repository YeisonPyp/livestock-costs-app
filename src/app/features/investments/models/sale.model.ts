// models/sale.model.ts

import { SaleDecisionType } from './enums';

// ── Sale Event Item ────────────────────────────────────────────────
export interface SaleEventItemInput {
  animalId: string;
  weight: number;
  pricePerKg: number;
}

export interface SaleEventItem {
  id: string;
  animal: string;
  animalTag: string;
  animalName: string;
  investorCode: string;
  investorName: string;
  weight: string;
  pricePerKg: string;
  grossAmount: string;
}

// ── Sale Event ─────────────────────────────────────────────────────
export interface SaleEventList {
  id: string;
  saleDate: string;
  description: string;
  buyerName: string | null;
  totalHeads: number;
  totalWeight: string;
  pricePerKg: string;
  grossAmount: string;
  saleCosts: string;
  netAmount: string;
  isFinalized: boolean;
  finalizedAt: string | null;
  pendingDecisionsCount: number;
  allDecisionsMade: boolean;
  createdAt: string;
}

export interface SaleEventDetail extends SaleEventList {
  notes: string;
  hasEvidence: boolean;
  items: SaleEventItem[];
  decisions: SaleDecisionSummary[];
  totalDecisions: number;
  processedDecisionsCount: number;
  canFinalize: boolean;
  finalizedBy: string | null;
}

// ── Sale Decision ──────────────────────────────────────────────────
export interface SaleDecisionSummary {
  id: string;
  saleEvent: string;
  saleEventDate: string;
  saleEventDescription: string;
  investorCode: string;
  investorName: string;
  investorAmount: string;
  profitLoss: string;
  decisionType: SaleDecisionType;
  decisionTypeDisplay: string;  
  reinvestAmount: string;
  withdrawAmount: string;
  decisionDate: string | null;
  decisionDeadline: string | null;
  createdAt: string;
  isPending: boolean;
  isDecided: boolean;
  isLoss: boolean;
  isTotalLoss: boolean;
  isOverdue: boolean;
  daysUntilDeadline: number | null;
  isProcessed: boolean;
  processedAt: string | null;
  notes: string;
}

export interface SaleDecisionList {
  id: string;
  investmentId: string;
  investorCode: string;
  investorName: string;
  saleEventId: string;
  saleDate: string;
  investorAmount: string;
  profitLoss: string;
  isLoss: boolean;
  decisionType: SaleDecisionType;
  decisionTypeDisplay: string;
  reinvestAmount: string;
  withdrawAmount: string;
  decisionDate: string | null;
  decisionDeadline: string | null;
  daysUntilDeadline: number | null;
  isPending: boolean;
  isProcessed: boolean;
  processedAt: string | null;
  notes: string;
}

export type SaleDecisionDetail = SaleDecisionList;

// ── Payloads ───────────────────────────────────────────────────────
export interface CreateSaleEventPayload {
  saleDate: string;
  description: string;
  buyerId?: string | null;
  saleCosts?: number;
  notes?: string;
  items: {
    animalId: string;
    weight: number;
    pricePerKg: number;
  }[];
}

export interface GenerateDecisionsPayload {
  decisionDeadline?: string | null;
}

export interface GenerateDecisionsResult {
  decisionsCreated: number;
  investorsNotified: number;
  autoResolved: number;
}

export interface MakeDecisionPayload {
  decisionType: SaleDecisionType;
  reinvestAmount?: number | null;
  withdrawAmount?: number | null;
  notes?: string;
}

export interface FinalizeResult {
  saleEvent: SaleEventDetail;
  processedDecisions: number;
  movementsCreated: number;
}

// ── Sale Summary (reporte financiero detallado) ────────────────────
export interface SaleFinancials {
  grossSale: string;
  costShare: string;
  netSale: string;
  purchaseValue: string;
  profitLoss: string;
  isProfit: boolean;
  contractNumber: string;
  investorPct: string;
  operatorPct: string;
  investorProfitShare: string;
  operatorProfitShare: string;
  investorReceivable: string;
}

export interface SaleSummaryInvestor {
  investorCode: string;
  investorName: string;
  heads: number;
  animals: {
    tag: string;
    weight: string;
    pricePerKg: string;
    grossAmount: string;
  }[];
  decision: {
    type: SaleDecisionType;
    investorAmount: string;
    profitLoss: string;
    reinvestAmount: string;
    withdrawAmount: string;
    isProcessed: boolean;
    isPending: boolean;
  };
  financials: SaleFinancials | null;
}

export interface SaleSummary {
  saleEvent: {
    id: string;
    saleDate: string;
    description: string;
    buyer: string;
    totalHeads: number;
    totalWeight: string;
    pricePerKg: string;
    grossAmount: string;
    saleCosts: string;
    netAmount: string;
    isFinalized: boolean;
    finalizedAt: string | null;
  };
  byInvestor: SaleSummaryInvestor[];
  totals: {
    totalProfitLoss: string;
    totalInvestorShare: string;
    totalOperatorShare: string;
    decisionsPending: number;
    decisionsProcessed: number;
  };
}

// ── Filtros ────────────────────────────────────────────────────────
export interface SaleEventFilters {
  isFinalized?: boolean;
  saleDate?: string;
  buyer?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

export interface SaleDecisionFilters {
  decisionType?: SaleDecisionType;
  isProcessed?: boolean;
  investor?: string;
  saleEvent?: string;
  page?: number;
  pageSize?: number;
}