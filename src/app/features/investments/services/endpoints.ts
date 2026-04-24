// services/endpoints.ts

const BASE = '/investments';

export const ENDPOINTS = {
  // Investors
  INVESTORS:               `${BASE}/investors/`,
  INVESTOR:                (id: string) => `${BASE}/investors/${id}/`,
  INVESTOR_DEACTIVATE:     (id: string) => `${BASE}/investors/${id}/deactivate/`,
  INVESTOR_REACTIVATE:     (id: string) => `${BASE}/investors/${id}/reactivate/`,
  INVESTOR_DEACT_STATUS:   (id: string) => `${BASE}/investors/${id}/deactivation-status/`,
  INVESTOR_SUMMARY:        (id: string) => `${BASE}/investors/${id}/summary/`,
  INVESTOR_STATEMENT:      (id: string) => `${BASE}/investors/${id}/statement/`,
  INVESTOR_CONTRACTS:      (id: string) => `${BASE}/investors/${id}/contracts/`,
  MY_SUMMARY:              `${BASE}/investors/me/summary/`,

  // Contracts
  CONTRACTS:               `${BASE}/contracts/`,
  CONTRACT:                (id: string) => `${BASE}/contracts/${id}/`,
  CONTRACT_ACTIVATE:       (id: string) => `${BASE}/contracts/${id}/activate/`,
  CONTRACT_TERMINATE:      (id: string) => `${BASE}/contracts/${id}/terminate/`,
  CONTRACT_RENEW:          (id: string) => `${BASE}/contracts/${id}/renew/`,
  CONTRACT_DOWNLOAD:       (id: string) => `${BASE}/contracts/${id}/download/`,
  CONTRACTS_ACTIVE:        `${BASE}/contracts/active/`,
  CONTRACTS_EXPIRING:      `${BASE}/contracts/expiring/`,
  CONTRACTS_EXPIRED:       `${BASE}/contracts/expired/`,

  // Investments
  INVESTMENTS:             `${BASE}/investments/`,
  INVESTMENT:              (id: string) => `${BASE}/investments/${id}/`,
  INVESTMENT_CONTRIBUTE:   (id: string) => `${BASE}/investments/${id}/contribute/`,
  INVESTMENT_WITHDRAW:     (id: string) => `${BASE}/investments/${id}/withdraw/`,
  INVESTMENT_MOVEMENTS:    (id: string) => `${BASE}/investments/${id}/movements/`,
  INVESTMENT_CLOSE:        (id: string) => `${BASE}/investments/${id}/close/`,
  INVESTMENT_CLOSURE_STATUS: (id: string) => `${BASE}/investments/${id}/closure-status/`,
  INVESTMENT_DASHBOARD:    (id: string) => `${BASE}/investments/${id}/dashboard/`,
  GLOBAL_SUMMARY:          `${BASE}/investments/global-summary/`,
  CAPITAL_EVOLUTION:       `${BASE}/investments/capital-evolution/`,
  INVESTOR_RANKING:        `${BASE}/investments/investor-ranking/`,
  PENDING_ACTIONS:         `${BASE}/investments/pending-actions/`,

  // Cattle Ownerships
  CATTLE_OWNERSHIPS:       `${BASE}/cattle-ownerships/`,
  CATTLE_OWNERSHIP:        (id: string) => `${BASE}/cattle-ownerships/${id}/`,
  CATTLE_OWNERSHIP_WEIGHT: (id: string) => `${BASE}/cattle-ownerships/${id}/record-weight/`,

  // Sale Events
  SALE_EVENTS:             `${BASE}/sale-events/`,
  SALE_EVENT:              (id: string) => `${BASE}/sale-events/${id}/`,
  SALE_EVENT_GENERATE:     (id: string) => `${BASE}/sale-events/${id}/generate/`,
  SALE_EVENT_PROCESS:      (id: string) => `${BASE}/sale-events/${id}/process/`,
  SALE_EVENT_SUMMARY:      (id: string) => `${BASE}/sale-events/${id}/summary/`,
  SALE_EVENT_UPLOAD_EV:    (id: string) => `${BASE}/sale-events/${id}/upload-evidence/`,
  SALE_EVENT_DELETE_EV:    (id: string) => `${BASE}/sale-events/${id}/delete-evidence/`,
  SALE_EVENT_DOWNLOAD_EV:  (id: string) => `${BASE}/sale-events/${id}/download-evidence/`,

  // Sale Decisions
  SALE_DECISIONS:          `${BASE}/sale-decisions/`,
  SALE_DECISION:           (id: string) => `${BASE}/sale-decisions/${id}/`,
  SALE_DECISION_DECIDE:    (id: string) => `${BASE}/sale-decisions/${id}/decide/`,
  SALE_DECISION_RESET:     (id: string) => `${BASE}/sale-decisions/${id}/reset/`,
  SALE_DECISIONS_PENDING:  `${BASE}/sale-decisions/my-pending/`,
  SALE_DECISIONS_HISTORY:  `${BASE}/sale-decisions/my-history/`,

  // Constants
  CONST_CONTRACT_STATUS:   `${BASE}/constants/contract-status/`,
  CONST_CONTRACT_TYPES:    `${BASE}/constants/contract-type/`,
  CONST_INV_STATUSES:      `${BASE}/constants/investment-status/`,
  CONST_MOVEMENT_TYPES:    `${BASE}/constants/investment-movement-type/`,
  CONST_DECISION_TYPES:    `${BASE}/constants/sale-decision-type/`,
  CONST_OWNERSHIP_STATUS:  `${BASE}/constants/cattle-ownership-status/`,

  // Reports
  REPORT_PARTICIPATION:    `${BASE}/reports/participation/`,
  REPORT_CATTLE_OWNERS:    `${BASE}/reports/cattle-owners/`,
} as const;