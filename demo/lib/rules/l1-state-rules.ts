import type { L1StateRules, StateCode } from './types'

// Sources:
// NSW — Strata Schemes Management Act 2015 (as amended 2023)
// VIC — Owners Corporations Act 2006 + OC Amendment Act 2021 + 2025 amendments
// QLD — Body Corporate and Community Management Act 1997 + BCCM Regulation 2008

export const l1StateRules: Record<StateCode, L1StateRules> = {
  NSW: {
    agm: {
      noticeDaysMin: 7,
      quorumPercent: 0.25,
      quorumFallbackMinutes: null,
      electronicVotingAllowed: true,
    },
    voting: {
      ordinaryResolutionThreshold: 0.50,
      specialResolutionThreshold: 0.75,
    },
    funds: {
      capitalWorksRequired: true,
      adminFundMinMonths: 3,
    },
    compliance: {
      retentionYears: 7,
      agmMinutesDeadlineDays: 14,
      levyNoticeDays: 14,
    },
    arrears: {
      interestRateMaxPercent: 10,
      legalActionMinDays: 21,
    },
    maintenance: {
      quoteThreshold: 3000,
      urgentWorkMax: 10000,
    },
  },

  VIC: {
    agm: {
      noticeDaysMin: 14,
      quorumPercent: 0.50,
      quorumFallbackMinutes: 30,
      electronicVotingAllowed: true,
    },
    voting: {
      ordinaryResolutionThreshold: 0.50,
      specialResolutionThreshold: 0.75,
    },
    funds: {
      capitalWorksRequired: true,
      adminFundMinMonths: 2,
    },
    compliance: {
      retentionYears: 10,
      agmMinutesDeadlineDays: 30,
      levyNoticeDays: 28,
    },
    arrears: {
      interestRateMaxPercent: 10,
      legalActionMinDays: 60,
    },
    maintenance: {
      quoteThreshold: 2000,
      urgentWorkMax: 5000,
    },
  },

  QLD: {
    agm: {
      noticeDaysMin: 21,
      quorumPercent: 0.25,
      quorumFallbackMinutes: 30,
      electronicVotingAllowed: true,
    },
    voting: {
      ordinaryResolutionThreshold: 0.50,
      specialResolutionThreshold: 0.75,
    },
    funds: {
      capitalWorksRequired: true,
      adminFundMinMonths: 3,
    },
    compliance: {
      retentionYears: 7,
      agmMinutesDeadlineDays: 21,
      levyNoticeDays: 30,
    },
    arrears: {
      interestRateMaxPercent: 12,
      legalActionMinDays: 90,
    },
    maintenance: {
      quoteThreshold: 6500,
      urgentWorkMax: 3250,
    },
  },
}
