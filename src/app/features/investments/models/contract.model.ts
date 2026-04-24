// models/contract.model.ts

import { BadgeColor } from '../../../shared/components/ui/badge/badge.component';
import { ContractStatus, ContractType } from './enums';

// ── Base (campos comunes a list y detail) ──────────────────────────
export interface ContractBase {
  id: string;
  contractNumber: string;
  version: number;
  investorId: string;
  investorCode: string;
  investorName: string;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isExpired: boolean;
  expiresSoon: boolean;
  createdAt: string;
}

// ── Listado ────────────────────────────────────────────────────────
export type ContractList = ContractBase;

// ── Detalle ────────────────────────────────────────────────────────
export interface ContractDetail extends ContractBase {
  contractUrl: string | null;
  signedDate: string | null;
  investorPercentage: string;
  operatorPercentage: string;
  initialInvestment: string | null;
  previousContractNumber: string | null;
  notes: string;
  termsAndConditions: string;
  daysUntilExpiry: number | null;
  isValid: boolean;
  activatedAt: string | null;
  activatedByUsername: string | null;
  terminatedAt: string | null;
  terminatedByUsername: string | null;
  terminationReason: string;
  updatedAt: string;
}

// ── Payloads ───────────────────────────────────────────────────────
export interface CreateContractPayload {
  investorId: string;
  contractFile: File;
  contractType: ContractType;
  startDate: string;
  endDate?: string | null;
  signedDate?: string | null;
  investorPercentage: number;
  operatorPercentage: number;
  initialInvestment?: number | null;
  notes?: string;
  termsAndConditions?: string;
}

export interface ActivateContractPayload {
  signedDate?: string | null;
}

export interface TerminateContractPayload {
  reason: string;
}

export interface RenewContractPayload {
  contractFile: File;
  startDate: string;
  endDate?: string | null;
  investorPercentage?: number | null;
  operatorPercentage?: number | null;
  initialInvestment?: number | null;
  notes?: string;
  termsAndConditions?: string;
}

// ── Filtros ────────────────────────────────────────────────────────
export interface ContractFilters {
  status?: ContractStatus;
  contractType?: ContractType;
  investorId?: string;
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

// ── UI helpers ─────────────────────────────────────────────────────
export const CONTRACT_STATUS_DISPLAY: Record<ContractStatus, { label: string; color: BadgeColor  }> = {
  [ContractStatus.DRAFT]:      { label: 'Borrador',   color: 'gray' },
  [ContractStatus.ACTIVE]:     { label: 'Activo',     color: 'success'   },
  [ContractStatus.EXPIRED]:    { label: 'Vencido',    color: 'danger'    },
  [ContractStatus.TERMINATED]: { label: 'Terminado',  color: 'danger' },
  [ContractStatus.RENEWED]:    { label: 'Renovado',   color: 'info'      },
};

export const CONTRACT_TYPE_DISPLAY: Record<ContractType, { label: string; color: BadgeColor  }> = {
  [ContractType.INITIAL]:   { label: 'Inicial',      color: 'primary' },
  [ContractType.RENEWAL]:   { label: 'Renovación',   color: 'success' },
  [ContractType.AMENDMENT]: { label: 'Modificación', color: 'warning' },
};