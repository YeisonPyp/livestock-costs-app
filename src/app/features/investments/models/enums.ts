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

// src/features/investments/models/enums.ts

export enum InvestmentMovementType {
  CONTRIBUTION         = 'contribution',
  WITHDRAWAL           = 'withdrawal',
  SALE_PROFIT          = 'sale_profit',
  DIVIDEND             = 'dividend',
  REINVESTMENT         = 'reinvestment',
  COST_SHARE           = 'cost_share',
  ADJUSTMENT           = 'adjustment',
  SALE_REVENUE         = 'sale_revenue',
  SALE_LOSS            = 'sale_loss',
  CATTLE_PURCHASE      = 'cattle_purchase',      // ✅ nuevo
  OPERATOR_COMMISSION  = 'operator_commission',   // ✅ nuevo
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