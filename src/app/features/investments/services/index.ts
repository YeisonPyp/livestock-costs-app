/**
 * Re-exports de servicios del módulo de inversiones.
 */

export * from './endpoints';
export * from './investor.service';
export * from './investment.service';
export * from './cattle-ownership.service';
export * from './sale.service';
export * from './investment-reports.service';

// Tipos de parámetros y payloads
export type {
  InvestorSearchParams,
  CreateInvestorPayload,
  UpdateInvestorPayload,
  StatementParams,
} from './investor.service';

export type {
  InvestmentSearchParams,
  MovementSearchParams,
  CapitalOperationResponse,
} from './investment.service';

export type {
  CattleOwnershipSearchParams,
  RecordWeightPayload,
  WeightRecordResponse,
} from './cattle-ownership.service';

export type {
  SaleEventSearchParams,
  SaleDecisionSearchParams,
  FinalizeResponse,
} from './sale.service';

export type {
  CattleOwnerReport,
} from './investment-reports.service';