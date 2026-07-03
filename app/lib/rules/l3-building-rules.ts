import type { L3BuildingRules } from './types'

// Building overrides must not violate L1 state law. They may be stricter than L2.
// Plan IDs match mockStrataPlans ids.

export const l3BuildingRules: Record<string, L3BuildingRules> = {
  '1': {
    // Southbank Residences — VIC, comp-1 (large 48-lot building, very strict)
    agm: { noticeDaysOverride: 28 },              // comp-1=21d → even stricter ✅
    maintenance: { quoteThresholdOverride: 1000 }, // comp-1=$1,500 → even stricter ✅
    voting: { allowElectronicVoting: true },
  },

  '2': {
    // Collins Street Apartments — VIC, comp-1 (small 12-lot building)
    finance: { levyRoundingOverride: 'up' },
    voting: { allowElectronicVoting: true },
  },

  '3': {
    // St Kilda Beach Villas — VIC, comp-2
    // comp-2 already violates VIC L1 quoteThreshold ($3k vs $2k law)
    // Building elects to disable electronic voting (state allows it, building opts out)
    voting: { allowElectronicVoting: false },
  },

  '4': {
    // Darling Harbour Towers — NSW, comp-2
    // Building tightens quote threshold further below comp-2's $3,000
    maintenance: { quoteThresholdOverride: 2000 }, // comp-2=$3,000 → stricter ✅, NSW L1=$3,000 ✅
    voting: { allowElectronicVoting: true },
    agm: { noticeDaysOverride: 21 },               // comp-2=14d → stricter ✅
  },

  '5': {
    // Brisbane River Residences — QLD, comp-3
    agm: { noticeDaysOverride: 30 },               // comp-3=28d → stricter ✅
    voting: { allowElectronicVoting: true },
  },
}
