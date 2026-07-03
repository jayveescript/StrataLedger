import type { RuleConstraint, RuleContext, RuleMetadata, RuleResolution, StateCode } from './types'
import { l1StateRules } from './l1-state-rules'
import { l2CompanyRules } from './l2-company-rules'
import { l3BuildingRules } from './l3-building-rules'

// ─── Rule metadata registry ──────────────────────────────────────────────────

const RULE_METADATA: Record<string, RuleMetadata> = {
  'agm.noticeDaysMin':              { constraint: 'minimum', label: 'AGM Notice Period',          unit: 'days',   description: 'Minimum days notice required before an AGM' },
  'agm.quorumPercent':              { constraint: 'fixed',   label: 'AGM Quorum',                 unit: '%',      description: 'Minimum percentage of lots required for valid quorum' },
  'agm.quorumFallbackMinutes':      { constraint: 'fixed',   label: 'Quorum Fallback',            unit: 'min',    description: 'Minutes after scheduled start a meeting can proceed without full quorum' },
  'agm.electronicVotingAllowed':    { constraint: 'override',label: 'Electronic Voting',          unit: 'bool',   description: 'State law permission for electronic voting (building may opt out)' },
  'voting.specialResolutionThreshold': { constraint: 'fixed',label: 'Special Resolution',         unit: '%',      description: 'Percentage of entitled votes required for a special resolution' },
  'voting.ordinaryResolutionThreshold':{ constraint: 'fixed',label: 'Ordinary Resolution',        unit: '%',      description: 'Simple majority threshold for ordinary motions' },
  'funds.capitalWorksRequired':     { constraint: 'fixed',   label: 'Capital Works Fund',         unit: 'bool',   description: 'Whether a capital works / sinking fund is legally required' },
  'funds.adminFundMinMonths':       { constraint: 'minimum', label: 'Admin Fund Reserve',         unit: 'months', description: 'Minimum months of operating expenses to hold as admin fund reserve' },
  'compliance.retentionYears':      { constraint: 'minimum', label: 'Records Retention',          unit: 'years',  description: 'Minimum years to retain financial and governance records' },
  'compliance.levyNoticeDays':      { constraint: 'minimum', label: 'Levy Notice Period',         unit: 'days',   description: 'Minimum days notice before a levy is due' },
  'compliance.agmMinutesDeadlineDays':{ constraint: 'maximum',label: 'AGM Minutes Deadline',      unit: 'days',   description: 'Maximum days after AGM to distribute minutes to lot owners' },
  'arrears.interestRateMaxPercent': { constraint: 'maximum', label: 'Arrears Interest Rate',      unit: '% p.a.', description: 'Maximum annual interest rate chargeable on overdue levies' },
  'arrears.legalActionMinDays':     { constraint: 'minimum', label: 'Legal Action Delay',         unit: 'days',   description: 'Minimum days before commencing legal debt recovery action' },
  'maintenance.quoteThreshold':     { constraint: 'maximum', label: 'Quote Threshold',            unit: '$',      description: 'Maximum job cost before obtaining multiple quotes is required (lower = stricter)' },
  'maintenance.urgentWorkMax':      { constraint: 'maximum', label: 'Urgent Work Limit',          unit: '$',      description: 'Maximum manager spend on urgent works without committee approval' },
}

// ─── Override path mapping (L1 canonical path → L2/L3 paths) ─────────────────

const PATH_OVERRIDES: Record<string, { l2Path?: string; l3Path?: string }> = {
  'agm.noticeDaysMin':               { l2Path: 'agm.noticeDaysOverride',           l3Path: 'agm.noticeDaysOverride' },
  'agm.quorumPercent':               {},
  'agm.quorumFallbackMinutes':       {},
  'agm.electronicVotingAllowed':     {                                               l3Path: 'voting.allowElectronicVoting' },
  'voting.specialResolutionThreshold': {},
  'voting.ordinaryResolutionThreshold': {},
  'funds.capitalWorksRequired':      {},
  'funds.adminFundMinMonths':        {},
  'compliance.retentionYears':       { l2Path: 'compliance.retentionYearsOverride' },
  'compliance.levyNoticeDays':       {},
  'compliance.agmMinutesDeadlineDays': {},
  'arrears.interestRateMaxPercent':  {},
  'arrears.legalActionMinDays':      {},
  'maintenance.quoteThreshold':      { l2Path: 'maintenance.quoteThreshold',        l3Path: 'maintenance.quoteThresholdOverride' },
  'maintenance.urgentWorkMax':       {},
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined
    return (cur as Record<string, unknown>)[key]
  }, obj)
}

function violates(l1: unknown, candidate: unknown, constraint: RuleConstraint): boolean {
  if (constraint === 'fixed' || constraint === 'override') return false
  if (typeof l1 !== 'number' || typeof candidate !== 'number') return false
  if (constraint === 'minimum') return candidate < l1   // below the legal floor
  if (constraint === 'maximum') return candidate > l1   // above the legal ceiling
  return false
}

export function formatRuleValue(path: string, value: unknown): string {
  const meta = RULE_METADATA[path]
  if (value === undefined || value === null) return '—'
  switch (meta?.unit) {
    case 'days':   return `${value} days`
    case 'min':    return value === null ? 'N/A' : `${value} min`
    case 'years':  return `${value} yrs`
    case 'months': return `${value} mo`
    case '%':      return typeof value === 'number' ? `${Math.round((value as number) * 100)}%` : String(value)
    case '% p.a.': return `${value}% p.a.`
    case '$':      return typeof value === 'number' ? `$${(value as number).toLocaleString()}` : String(value)
    case 'bool':   return value ? 'Yes' : 'No'
    default:       return String(value)
  }
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export function resolveRule(path: string, context: RuleContext): RuleResolution {
  const meta = RULE_METADATA[path]
  if (!meta) throw new Error(`Unknown rule path: "${path}"`)

  const l1Data  = l1StateRules[context.stateCode as StateCode] as unknown as Record<string, unknown>
  const l2Data  = (l2CompanyRules[context.companyId]  ?? {}) as Record<string, unknown>
  const l3Data  = (l3BuildingRules[context.buildingId] ?? {}) as Record<string, unknown>
  const overrides = PATH_OVERRIDES[path] ?? {}

  const l1Value = getNestedValue(l1Data, path)
  const l2Value = overrides.l2Path ? getNestedValue(l2Data, overrides.l2Path) : undefined
  const l3Value = overrides.l3Path ? getNestedValue(l3Data, overrides.l3Path) : undefined

  let finalValue: unknown = l1Value
  let source: 'L1' | 'L2' | 'L3' = 'L1'
  let isViolation = false
  let violatingLayer = ''

  if (meta.constraint !== 'fixed' && l2Value !== undefined) {
    if (violates(l1Value, l2Value, meta.constraint)) {
      isViolation = true
      violatingLayer = 'L2'
      // L1 floor/ceiling enforced — finalValue stays at l1Value
    } else {
      finalValue = l2Value
      source = 'L2'
    }
  }

  if (meta.constraint !== 'fixed' && l3Value !== undefined) {
    if (violates(l1Value, l3Value, meta.constraint)) {
      isViolation = true
      violatingLayer = violatingLayer || 'L3'
    } else {
      finalValue = l3Value
      source = 'L3'
    }
  }

  // Build explanation
  const fmtL1 = formatRuleValue(path, l1Value)
  const fmtFinal = formatRuleValue(path, finalValue)
  let explanation: string

  if (isViolation) {
    const badLayer = violatingLayer === 'L2' ? l2Value : l3Value
    const dir = meta.constraint === 'minimum' ? 'falls below' : 'exceeds'
    explanation = `${violatingLayer} sets ${formatRuleValue(path, badLayer)}, which ${dir} the ${context.stateCode} legal ${meta.constraint} of ${fmtL1}. State law is enforced — final value: ${fmtFinal}.`
  } else if (source === 'L3') {
    const l2Desc = l2Value !== undefined ? ` Company policy was ${formatRuleValue(path, l2Value)}.` : ''
    explanation = `Building override applied (${fmtFinal}).${l2Desc} ${context.stateCode} law requires ${meta.constraint === 'fixed' ? '' : meta.constraint + ' '}${fmtL1}.`
  } else if (source === 'L2') {
    explanation = `Company policy applied (${fmtFinal}). ${context.stateCode} law requires ${meta.constraint === 'fixed' ? '' : meta.constraint + ' '}${fmtL1}.`
  } else {
    const noOverride = meta.constraint !== 'fixed' ? ' No company or building override.' : ''
    explanation = `${meta.constraint === 'fixed' ? 'Fixed by' : 'State law default:'} ${context.stateCode} — ${fmtL1}.${noOverride}`
  }

  return { value: finalValue, source, l1Value, l2Value, l3Value, explanation, isViolation }
}

export function getAllRulePaths(): string[] {
  return Object.keys(RULE_METADATA)
}

export function getRuleMetadata(path: string): RuleMetadata {
  return RULE_METADATA[path]
}
