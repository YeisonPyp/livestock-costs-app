// mappers/investment.mapper.ts
//
// Centraliza la transformación de respuestas del backend (snake_case)
// a los modelos frontend (camelCase).
// Úsalo dentro del pipe() de tus observables o en servicios de datos.

import {
  ContractList,
  ContractDetail,
  InvestorList,
  InvestorDetail,
  InvestorSummary,
  InvestorStatement,
  StatementMovement,
  DeactivateInvestorResult,
  DeactivationStatus,
  InvestmentList,
  InvestmentDetail,
  InvestmentMovement,
  InvestmentDashboard,
  ClosureStatus,
  GlobalInvestmentSummary,
  CattleOwnership,
  WeightRecord,
  SaleEventList,
  SaleEventDetail,
  SaleDecisionList,
  SaleDecisionSummary,
  SaleSummary,
  GenerateDecisionsResult,
  FinalizeResult,
  ParticipationReport,
  CattleOwnerReport,
  CattleOwnershipSummary,
} from '../models';

// ── Contracts ──────────────────────────────────────────────────────

export function toContractList(raw: any): ContractList {
  return {
    id: raw.id,
    contractNumber: raw.contract_number,
    version: raw.version,
    investorId: raw.investor_id,
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    contractType: raw.contract_type,
    status: raw.status,
    startDate: raw.start_date,
    endDate: raw.end_date,
    isActive: raw.is_active,
    isExpired: raw.is_expired,
    expiresSoon: raw.expires_soon,
    createdAt: raw.created_at,
  };
}

export function toContractDetail(raw: any): ContractDetail {
  return {
    ...toContractList(raw),
    contractUrl: raw.contract_url,
    signedDate: raw.signed_date,
    investorPercentage: raw.investor_percentage,
    operatorPercentage: raw.operator_percentage,
    initialInvestment: raw.initial_investment,
    previousContractNumber: raw.previous_contract_number,
    notes: raw.notes,
    termsAndConditions: raw.terms_and_conditions,
    daysUntilExpiry: raw.days_until_expiry,
    isValid: raw.is_valid,
    activatedAt: raw.activated_at,
    activatedByUsername: raw.activated_by_username,
    terminatedAt: raw.terminated_at,
    terminatedByUsername: raw.terminated_by_username,
    terminationReason: raw.termination_reason,
    updatedAt: raw.updated_at,
  };
}

// Transforma payload camelCase → FormData snake_case para el backend
export function contractToFormData(payload: Record<string, any>): FormData {
  const fd = new FormData();
  const mapping: Record<string, string> = {
    investorId: 'investor_id',
    contractFile: 'contract_file',
    contractType: 'contract_type',
    startDate: 'start_date',
    endDate: 'end_date',
    signedDate: 'signed_date',
    investorPercentage: 'investor_percentage',
    operatorPercentage: 'operator_percentage',
    initialInvestment: 'initial_investment',
    termsAndConditions: 'terms_and_conditions',
  };

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;
    const snakeKey = mapping[key] ?? key;
    fd.append(snakeKey, value instanceof File ? value : String(value));
  }
  return fd;
}

// ── Investors ──────────────────────────────────────────────────────

export function toInvestorList(raw: any): InvestorList {
  return {
    id: raw.id,
    code: raw.code,
    fullName: raw.full_name,
    documentNumber: raw.document_number,
    email: raw.email,
    joinedDate: raw.joined_date,
    isActive: raw.is_active,
    hasActiveContract: raw.has_active_contract,
    totalCattle: Number(raw.total_cattle ?? 0),
    totalCapital: Number(raw.total_capital ?? 0),
    totalInvestments: Number(raw.total_investments ?? 0),
  };
}

export function toInvestorDetail(raw: any): InvestorDetail {
  return {
    id: raw.id,
    code: raw.code,
    personId: raw.person_id,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    documentNumber: raw.document_number,
    joinedDate: raw.joined_date,
    currentInvestorPercentage: raw.current_investor_percentage,
    currentOperatorPercentage: raw.current_operator_percentage,
    notifySales: raw.notify_sales,
    notifyWeightGains: raw.notify_weight_gains,
    defaultSaleDecision: raw.default_sale_decision,
    notes: raw.notes,
    userIsActive: raw.user_is_active,
    isActive: raw.is_active,
    hasActiveContract: raw.has_active_contract,
    totalContracts: raw.total_contracts,
    activeContract: raw.active_contract ? toContractList(raw.active_contract) : null,
    latestContract: raw.latest_contract ? toContractList(raw.latest_contract) : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function toInvestorSummary(raw: any): InvestorSummary {
  return {
    investor: {
      id: raw.investor.id,
      code: raw.investor.code,
      name: raw.investor.name,
      email: raw.investor.email,
      phone: raw.investor.phone,
      documentNumber: raw.investor.document_number,
      joinedDate: raw.investor.joined_date,
      isActive: raw.investor.is_active,
      hasActiveContract: raw.investor.has_active_contract,
      totalContracts: raw.investor.total_contracts,
    },
    investments: {
      count: raw.investments.count,
      totalCapital: raw.investments.total_capital,
      totalContributions: raw.investments.total_contributions,
      totalWithdrawals: raw.investments.total_withdrawals,
      totalProfits: raw.investments.total_profits,
    },
    cattle: {
      totalHeads: raw.cattle.total_heads,
      totalValue: raw.cattle.total_value,
      totalWeight: raw.cattle.total_weight,
      averageWeight: raw.cattle.average_weight,
    },
    pendingDecisions: raw.pending_decisions,
    decisiondList: (raw.decisions_list ?? []).map(toSaleDecisionSummary),
    movementsList: (raw.movements_list ?? []).map(toInvestmentMovement),
    cattleList: (raw.cattle_list ?? []).map(toCattleSummary),
  };
}

export function toStatementMovement(raw: any): StatementMovement {
  return {
    date: raw.date,
    type: raw.type,
    description: raw.description,
    amount: raw.amount,
    balance: raw.balance,
    isCredit: raw.is_credit,
  };
}

export function toInvestorStatement(raw: any): InvestorStatement {
  return {
    investor: raw.investor,
    period: raw.period,
    movements: (raw.movements ?? []).map(toStatementMovement),
    periodTotals: {
      contributions: raw.period_totals.contributions,
      withdrawals: raw.period_totals.withdrawals,
      profits: raw.period_totals.profits,
      costs: raw.period_totals.costs,
    },
    currentBalance: raw.current_balance,
  };
}

export function toDeactivateResult(raw: any): DeactivateInvestorResult {
  return {
    deactivated: raw.deactivated,
    requiresForce: raw.requires_force,
    warnings: raw.warnings,
  };
}

export function toDeactivationStatus(raw: any): DeactivationStatus {
  return {
    canDeactivate: raw.can_deactivate,
    blocking: raw.blocking,
    warnings: raw.warnings,
    requiresForce: raw.requires_force,
  };
}

// ── Investments ────────────────────────────────────────────────────

export function toInvestmentList(raw: any): InvestmentList {
  return {
    id: raw.id,
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    initialCapital: raw.initial_capital,
    currentCapital: raw.current_capital,
    totalContributions: raw.total_contributions,
    totalWithdrawals: raw.total_withdrawals,
    totalProfits: raw.total_profits,
    totalCosts: raw.total_costs,
    status: raw.status,
    cattleCount: raw.cattle_count,
    cattlePurchaseValue: raw.cattle_purchase_value,
    roi: raw.roi,
    netProfit: raw.net_profit,
    startDate: raw.start_date,
    endDate: raw.end_date,
    createdAt: raw.created_at,
  };
}

export function toInvestmentDetail(raw: any): InvestmentDetail {
  const cs = raw.cattle_stats ?? {};
  return {
    ...toInvestmentList(raw),
    investorId: raw.investor_id,
    cattleStats: {
      totalHeads: cs.count ?? 0,
      totalValue: String(cs.total_purchase_value ?? 0),
      totalWeight: '0',          // ⚠️ backend no lo envía
      averageWeight: '0',        // ⚠️ backend no lo envía
      activeCount: cs.count ?? 0, // o lógica distinta si aplica
    },
    canClose: raw.can_close,
    notes: raw.notes,
    updatedAt: raw.updated_at,
  };
}

export function toInvestmentMovement(raw: any): InvestmentMovement {
  return {
    id: raw.id,
    movementType: raw.movement_type,
    movementTypeDisplay: raw.movement_type_display,
    amount: raw.amount,
    balanceAfter: raw.balance_after,
    effectiveDate: raw.effective_date,
    description: raw.description,
    notes: raw.notes ?? '',
    referenceType: raw.reference_type ?? null,
    referenceId: raw.reference_id ?? null,
    isCredit: raw.is_credit,
    isDebit: raw.is_debit,
    createdByName: raw.created_by_name ?? null,
    createdByUsername: raw.created_by_username ?? null,
    createdAt: raw.created_at,
  };
}

export function toClosureStatus(raw: any): ClosureStatus {
  return {
    canClose: raw.can_close,
    blocking: raw.blocking,
    summary: {
      activeCattle: raw.summary.active_cattle,
      pendingDecisions: raw.summary.pending_decisions,
      currentBalance: raw.summary.current_balance,
    },
  };
}


export function toGlobalSummary(raw: any): GlobalInvestmentSummary {
  return {
    totalInvested:        raw.total_invested ?? 0,
    totalCurrentCapital:  raw.total_current_capital ?? 0,
    totalProfits:         raw.total_profits ?? 0,
    totalCosts:           raw.total_costs ?? 0,
    activeCount:          raw.active_count ?? 0,
    closedCount:          raw.closed_count ?? 0,
    totalClosedCapital:   raw.total_closed_capital ?? 0,
    avgRoi:               raw.avg_roi ?? 0,
  };
}

// ── Cattle Ownership ───────────────────────────────────────────────

export function toCattleOwnership(raw: any): CattleOwnership {
  return {
    id: raw.id,
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    ownershipType: raw.ownership_type,
    animal: raw.animal,
    lot: raw.lot,
    quantity: raw.quantity,
    ownershipPercentage: raw.ownership_percentage,
    purchaseValue: raw.purchase_value,
    currentValue: raw.current_value,
    valueAppreciation: raw.value_appreciation,
    valueAppreciationPercentage: raw.value_appreciation_percentage,
    initialWeight: raw.initial_weight,
    currentWeight: raw.current_weight,
    weightGain: raw.weight_gain,
    weightGainPercentage: raw.weight_gain_percentage,
    acquisitionDate: raw.acquisition_date,
    status: raw.status,
  };
}

export function toCattleSummary(raw: any): CattleOwnershipSummary {
  return {
    id: raw.id,
    tagNumber: raw.tag_number,
    name: raw.name,
    breedName: raw.breed_name,
    gender: raw.gender,
    category: raw.category,
    lotCode: raw.lot_code,
    currentWeight: raw.current_weight,
    currentValue: raw.current_value,
    ageMonths: raw.age_months,
    weightGain: raw.weight_gain,
    dailyGain: raw.daily_gain,
    purchasePrice: raw.purchase_price,
    status: raw.status,
    entryDate: raw.entry_date,
    lastWeightDate: raw.last_weight_date,
  };
}


export function toWeightRecord(raw: any): WeightRecord {
  return {
    id: raw.id,
    weight: raw.weight,
    pricePerKg: raw.price_per_kg,
    estimatedValue: raw.estimated_value,
    recordDate: raw.record_date,
    createdAt: raw.created_at,
  };
}

export function assignCattleToFormData(payload: Record<string, any>): Record<string, any> {
  return {
    investment_id: payload['investmentId'],
    ownership_type: payload['ownershipType'],
    animal_id: payload['animalId'],
    lot_id: payload['lotId'],
    quantity: payload['quantity'],
    ownership_percentage: payload['ownershipPercentage'],
    purchase_value: payload['purchaseValue'],
    initial_weight: payload['initialWeight'],
    acquisition_date: payload['acquisitionDate'],
    notes: payload['notes'],
  };
}


// ── Sale Events ────────────────────────────────────────────────────

export function toSaleEventList(raw: any): SaleEventList {
  return {
    id: raw.id,
    saleDate: raw.sale_date,
    description: raw.description,
    buyerName: raw.buyer_name,
    totalHeads: raw.total_heads,
    totalWeight: raw.total_weight,
    pricePerKg: raw.price_per_kg,
    grossAmount: raw.gross_amount,
    saleCosts: raw.sale_costs,
    netAmount: raw.net_amount,
    isFinalized: raw.is_finalized,
    finalizedAt: raw.finalized_at,
    pendingDecisionsCount: raw.pending_decisions_count,
    allDecisionsMade: raw.all_decisions_made,
    createdAt: raw.created_at,
  };
}

export function toSaleDecisionSummary(raw: any): SaleDecisionSummary {
  return {
    id: raw.id,
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    investorAmount: raw.investor_amount,
    profitLoss: raw.profit_loss,
    isLoss: raw.is_loss,
    isTotalLoss: raw.is_total_loss,
    decisionType: raw.decision_type,
    decisionTypeDisplay: raw.decision_type_display,
    reinvestAmount: raw.reinvest_amount,
    withdrawAmount: raw.withdraw_amount,
    decisionDate: raw.decision_date,
    decisionDeadline: raw.decision_deadline,
    isPending: raw.is_pending,
    isProcessed: raw.is_processed,
    processedAt: raw.processed_at,
  };
}

export function toSaleEventDetail(raw: any): SaleEventDetail {
  return {
    ...toSaleEventList(raw),
    notes: raw.notes,
    hasEvidence: raw.has_evidence,
    items: (raw.items ?? []).map((i: any) => ({
      id: i.id,
      animal: i.animal,
      animalTag: i.animal_tag,
      animalName: i.animal_name,
      investorCode: i.investor_code,
      investorName: i.investor_name,
      weight: i.weight,
      pricePerKg: i.price_per_kg,
      grossAmount: i.gross_amount,
    })),
    decisions: (raw.decisions ?? []).map(toSaleDecisionSummary),
    totalDecisions: raw.total_decisions,
    processedDecisionsCount: raw.processed_decisions_count,
    canFinalize: raw.can_finalize,
    finalizedBy: raw.finalized_by,
  };
}

export function toSaleDecisionList(raw: any): SaleDecisionList {
  return {
    id: raw.id,
    investmentId: raw.investment_id,
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    saleEventId: raw.sale_event_id,
    saleDate: raw.sale_date,
    investorAmount: raw.investor_amount,
    profitLoss: raw.profit_loss,
    isLoss: raw.is_loss,
    decisionType: raw.decision_type,
    decisionTypeDisplay: raw.decision_type_display,
    reinvestAmount: raw.reinvest_amount,
    withdrawAmount: raw.withdraw_amount,
    decisionDate: raw.decision_date,
    decisionDeadline: raw.decision_deadline,
    daysUntilDeadline: raw.days_until_deadline,
    isPending: raw.is_pending,
    isProcessed: raw.is_processed,
    processedAt: raw.processed_at,
    notes: raw.notes,
  };
}

export function toGenerateDecisionsResult(raw: any): GenerateDecisionsResult {
  return {
    decisionsCreated: raw.decisions_created,
    investorsNotified: raw.investors_notified,
    autoResolved: raw.auto_resolved,
  };
}

export function toFinalizeResult(raw: any): FinalizeResult {
  return {
    saleEvent: toSaleEventDetail(raw.sale_event),
    processedDecisions: raw.processed_decisions,
    movementsCreated: raw.movements_created,
  };
}

// ── Reports ────────────────────────────────────────────────────────

export function toParticipationReport(raw: any): ParticipationReport {
  return {
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    totalCapital: raw.total_capital,
    totalCattle: raw.total_cattle,
    participationPercentage: raw.participation_percentage,
  };
}

export function toCattleOwnerReport(raw: any): CattleOwnerReport {
  return {
    investorCode: raw.investor_code,
    investorName: raw.investor_name,
    animalTag: raw.animal_tag,
    breed: raw.breed,
    purchaseValue: raw.purchase_value,
    currentWeight: raw.current_weight,
    currentValue: raw.current_value,
    weightGain: raw.weight_gain,
    acquisitionDate: raw.acquisition_date,
  };
}