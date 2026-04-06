// modules/investments/models/contract.model.ts

export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'renewed';
export type ContractType = 'initial' | 'renewal' | 'amendment' | 'termination';

export interface InvestorContract {
  id: string;
  contract_number: string;
  version: number;
  investor: string;
  investor_code: string;
  investor_name: string;
  contract_type: ContractType;
  contract_type_display: string;
  status: ContractStatus;
  status_display: string;
  contract_url: string | null;
  start_date: string;
  end_date: string | null;
  signed_date: string | null;
  investor_percentage: string;
  operator_percentage: string;
  initial_investment: string | null;
  previous_contract_number: string | null;
  notes: string;
  terms_and_conditions: string;
  // Propiedades calculadas
  is_active: boolean;
  is_expired: boolean;
  expires_soon: boolean;
  days_until_expiry: number | null;
  is_valid: boolean;
  // Auditoría
  activated_at: string | null;
  activated_by_username: string | null;
  terminated_at: string | null;
  terminated_by_username: string | null;
  termination_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ContractListItem {
  id: string;
  contract_number: string;
  version: number;
  investor_code: string;
  investor_name: string;
  contract_type: ContractType;
  contract_type_display: string;
  status: ContractStatus;
  status_display: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_expired: boolean;
  expires_soon: boolean;
  created_at: string;
}

export interface CreateContractPayload {
  investor_id: string;
  contract_file: File;
  contract_type: ContractType;
  start_date: string;
  end_date?: string | null;
  signed_date?: string | null;
  investor_percentage: number;
  operator_percentage: number;
  initial_investment?: number | null;
  notes?: string;
  terms_and_conditions?: string;
}

export interface ActivateContractPayload {
  signed_date?: string | null;
}

export interface TerminateContractPayload {
  reason: string;
}

export interface RenewContractPayload {
  contract_file: File;
  start_date: string;
  end_date?: string | null;
  investor_percentage?: number | null;
  operator_percentage?: number | null;
  initial_investment?: number | null;
  notes?: string;
  terms_and_conditions?: string;
}

// Constantes
export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador', color: 'secondary', icon: 'file-text' },
  { value: 'pending_signature', label: 'Pendiente Firma', color: 'warning', icon: 'clock' },
  { value: 'active', label: 'Activo', color: 'success', icon: 'check-circle' },
  { value: 'expired', label: 'Vencido', color: 'danger', icon: 'alert-circle' },
  { value: 'terminated', label: 'Terminado', color: 'secondary', icon: 'x-circle' },
  { value: 'renewed', label: 'Renovado', color: 'info', icon: 'refresh-cw' },
] as const;

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'initial', label: 'Inicial', color: 'primary' },
  { value: 'renewal', label: 'Renovación', color: 'success' },
  { value: 'amendment', label: 'Modificación', color: 'warning' },
  { value: 'termination', label: 'Terminación', color: 'danger' },
] as const;

export function getStatusColor(status: ContractStatus): string {
  return CONTRACT_STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'secondary';
}

export function getTypeColor(type: ContractType): string {
  return CONTRACT_TYPE_OPTIONS.find(t => t.value === type)?.color ?? 'secondary';
}