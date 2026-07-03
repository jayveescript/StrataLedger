import type { L2CompanyRules } from './types'

// Company policies must respect state law minimums/maximums.
// comp-2's quoteThreshold of $3,000 is valid for NSW (L1=$3,000) but VIOLATES VIC (L1=$2,000).
// The resolver enforces L1 as the floor/ceiling — this intentional violation is here for demo purposes.

export const l2CompanyRules: Record<string, L2CompanyRules> = {
  'comp-1': {
    // Premier Strata VIC — strict, quality-focused
    agm: { noticeDaysOverride: 21 },       // VIC L1=14d → stricter ✅
    arrears: { escalationDays: 45 },
    maintenance: { quoteThreshold: 1500 }, // VIC L1=$2,000 → stricter (lower = more quotes) ✅
    finance: {
      roundingRule: 'up',
      invoiceApprovalThreshold: 5000,
    },
  },

  'comp-2': {
    // ABC Strata NSW/VIC — uniform policy across both states
    agm: { noticeDaysOverride: 14 },       // NSW L1=7d → stricter ✅ | VIC L1=14d → equal ✅
    arrears: { escalationDays: 20 },
    maintenance: { quoteThreshold: 3000 }, // NSW L1=$3,000 → equal ✅ | VIC L1=$2,000 → VIOLATION ⚠️
    finance: {
      roundingRule: 'nearest',
      invoiceApprovalThreshold: 3000,
    },
  },

  'comp-3': {
    // Metro Property Management — QLD operator
    agm: { noticeDaysOverride: 28 },           // QLD L1=21d → stricter ✅
    arrears: { escalationDays: 60 },
    maintenance: { quoteThreshold: 5000 },     // QLD L1=$6,500 → stricter ✅
    finance: {
      roundingRule: 'nearest',
      invoiceApprovalThreshold: 7500,
    },
    compliance: { retentionYearsOverride: 10 }, // QLD L1=7yrs → stricter ✅
  },
}
