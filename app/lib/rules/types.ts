export type StateCode = 'NSW' | 'VIC' | 'QLD'
export type RuleConstraint = 'minimum' | 'maximum' | 'fixed' | 'override'

export interface L1StateRules {
  agm: {
    noticeDaysMin: number
    quorumPercent: number
    quorumFallbackMinutes: number | null
    electronicVotingAllowed: boolean
  }
  voting: {
    ordinaryResolutionThreshold: number
    specialResolutionThreshold: number
  }
  funds: {
    capitalWorksRequired: boolean
    adminFundMinMonths: number
  }
  compliance: {
    retentionYears: number
    agmMinutesDeadlineDays: number
    levyNoticeDays: number
  }
  arrears: {
    interestRateMaxPercent: number
    legalActionMinDays: number
  }
  maintenance: {
    quoteThreshold: number
    urgentWorkMax: number
  }
}

export interface L2CompanyRules {
  agm?: {
    noticeDaysOverride?: number
  }
  arrears?: {
    escalationDays?: number
  }
  maintenance?: {
    quoteThreshold?: number
  }
  finance?: {
    roundingRule?: 'up' | 'down' | 'nearest'
    invoiceApprovalThreshold?: number
  }
  compliance?: {
    retentionYearsOverride?: number
  }
}

export interface L3BuildingRules {
  agm?: {
    noticeDaysOverride?: number
  }
  maintenance?: {
    quoteThresholdOverride?: number
  }
  voting?: {
    allowElectronicVoting?: boolean
  }
  finance?: {
    levyRoundingOverride?: 'up' | 'down' | 'nearest'
  }
}

export interface RuleResolution {
  value: unknown
  source: 'L1' | 'L2' | 'L3'
  l1Value: unknown
  l2Value: unknown
  l3Value: unknown
  explanation: string
  isViolation: boolean
}

export interface RuleContext {
  stateCode: StateCode
  companyId: string
  buildingId: string
}

export interface RuleMetadata {
  constraint: RuleConstraint
  label: string
  unit: string
  description: string
}
