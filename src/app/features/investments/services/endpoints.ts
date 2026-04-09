/**
 * Endpoints centralizados del módulo de inversiones.
 * Facilita mantenimiento y evita typos.
 */
export const INVESTMENT_ENDPOINTS = {
  // Investors
  INVESTORS: '/investments/investors/',
  INVESTOR: (id: string) => `/investments/investors/${id}/`,
  INVESTOR_SUMMARY: (id: string) => `/investments/investors/${id}/summary/`,
  INVESTOR_STATEMENT: (id: string) => `/investments/investors/${id}/statement/`,
  MY_SUMMARY: '/investments/investors/me/summary/',

  // Investments
  INVESTMENTS: '/investments/investments/',
  INVESTMENT: (id: string) => `/investments/investments/${id}/`,
  INVESTMENT_CONTRIBUTE: (id: string) => `/investments/investments/${id}/contribute/`,
  INVESTMENT_WITHDRAW: (id: string) => `/investments/investments/${id}/withdraw/`,
  INVESTMENT_MOVEMENTS: (id: string) => `/investments/investments/${id}/movements/`,
  INVESTMENT_CLOSE: (id: string) => `/investments/investments/${id}/close/`,
  INVESTMENT_CLOSURE_STATUS: (id: string) => `/investments/investments/${id}/closure-status/`,
  INVESTMENT_DASHBOARD: (id: string) => `/investments/investments/${id}/dashboard/`,
  
  // Global stats
  GLOBAL_SUMMARY: '/investments/investments/global-summary/',
  CAPITAL_EVOLUTION: '/investments/investments/capital-evolution/',
  INVESTOR_RANKING: '/investments/investments/investor-ranking/',
  PENDING_ACTIONS: '/investments/investments/pending-actions/',

  // Cattle Ownerships
  CATTLE_OWNERSHIPS: '/investments/cattle-ownerships/',
  CATTLE_OWNERSHIP: (id: string) => `/investments/cattle-ownerships/${id}/`,
  CATTLE_OWNERSHIP_RECORD_WEIGHT: (id: string) => `/investments/cattle-ownerships/${id}/record-weight/`,

  // Sale Events
  SALE_EVENTS: '/investments/sale-events/',
  SALE_EVENT: (id: string) => `/investments/sale-events/${id}/`,
  SALE_EVENT_DECISIONS: (id: string) => `/investments/sale-events/${id}/decisions/`,
  SALE_EVENT_FINALIZE: (id: string) => `/investments/sale-events/${id}/finalize/`,

  // Sale Decisions
  SALE_DECISIONS: '/investments/sale-decisions/',
  SALE_DECISION: (id: string) => `/investments/sale-decisions/${id}/`,
  SALE_DECISION_DECIDE: (id: string) => `/investments/sale-decisions/${id}/decide/`,

  // Reports
  REPORT_PARTICIPATION: '/investments/reports/participation/',
  REPORT_CATTLE_OWNERS: '/investments/reports/cattle-owners/',
} as const;