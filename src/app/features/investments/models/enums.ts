// models/enums.ts

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

export enum ContractType {
  INITIAL = 'initial',
  RENEWAL = 'renewal',
  AMENDMENT = 'amendment',
}

export enum InvestmentStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum InvestmentMovementType {
  CONTRIBUTION = 'contribution',
  WITHDRAWAL = 'withdrawal',
  REINVESTMENT = 'reinvestment',
  SALE_REVENUE = 'sale_revenue',
  COST_SHARE = 'cost_share',
  SALE_PROFIT = 'sale_profit',
  SALE_LOSS = 'sale_loss',
  ADJUSTMENT = 'adjustment',
}

export enum SaleDecisionType {
  PENDING = 'pending',
  REINVEST = 'reinvest',
  WITHDRAW = 'withdraw',
  PARTIAL = 'partial',
  FULL_WITHDRAWAL = 'full_withdrawal',
}

export enum CattleOwnershipStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  DEAD = 'dead',
  TRANSFERRED = 'transferred',
}

export enum OwnershipType {
  INDIVIDUAL = 'individual',
  LOT = 'lot',
  PERCENTAGE = 'percentage',
}