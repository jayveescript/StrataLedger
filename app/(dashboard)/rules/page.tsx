"use client"
import { useState, useMemo, useCallback } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Info, Scale, Building2, Layers } from "lucide-react"
import { resolveRule, getAllRulePaths, getRuleMetadata, formatRuleValue } from "@/lib/rules/resolver"
import type { RuleContext, RuleResolution, StateCode } from "@/lib/rules/types"
import { mockCompanies } from "@/lib/mock-data/companies"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: 'L1' | 'L2' | 'L3' }) {
  const styles = {
    L1: 'bg-blue-100 text-blue-700 border-blue-200',
    L2: 'bg-amber-100 text-amber-700 border-amber-200',
    L3: 'bg-green-100 text-green-700 border-green-200',
  }
  const labels = { L1: 'L1 State', L2: 'L2 Company', L3: 'L3 Building' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[source]}`}>
      {labels[source]}
    </span>
  )
}

function RuleRow({ path, resolution, showExplanation }: { path: string; resolution: RuleResolution; showExplanation?: boolean }) {
  const meta = getRuleMetadata(path)
  return (
    <div className={`rounded-lg border px-4 py-3 space-y-1 ${resolution.isViolation ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {resolution.isViolation && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-slate-900">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{formatRuleValue(path, resolution.value)}</span>
          <SourceBadge source={resolution.source} />
        </div>
      </div>
      {showExplanation && (
        <p className="text-xs text-slate-500 leading-relaxed">{resolution.explanation}</p>
      )}
    </div>
  )
}

function WorkflowStep({ step, label, status, detail }: { step: number; label: string; status: 'ok' | 'warn' | 'required' | 'neutral'; detail: string }) {
  const styles = {
    ok: 'border-green-200 bg-green-50',
    warn: 'border-amber-200 bg-amber-50',
    required: 'border-red-200 bg-red-50',
    neutral: 'border-slate-200 bg-slate-50',
  }
  const dotStyles = {
    ok: 'bg-green-500',
    warn: 'bg-amber-500',
    required: 'bg-red-500',
    neutral: 'bg-slate-300',
  }
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${styles[status]}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${dotStyles[status]}`}>
        <span className="text-white text-xs font-bold">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-600 mt-0.5">{detail}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const [stateCode, setStateCode] = useState<StateCode>('VIC')
  const [companyId, setCompanyId] = useState('comp-1')
  const [buildingId, setBuildingId] = useState('1')
  const [proposedNoticeDays, setProposedNoticeDays] = useState(21)
  const [jobCost, setJobCost] = useState(2500)
  const [levyAdminPerLot, setLevyAdminPerLot] = useState(400)
  const [levyCwPerLot, setLevyCwPerLot] = useState(250)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  const context: RuleContext = useMemo(() => ({ stateCode, companyId, buildingId }), [stateCode, companyId, buildingId])

  const allRules = useMemo(() => {
    const paths = getAllRulePaths()
    const map = new Map<string, RuleResolution>()
    for (const path of paths) map.set(path, resolveRule(path, context))
    return map
  }, [context])

  const r = useCallback((path: string) => allRules.get(path)!, [allRules])

  const availableCompanies = useMemo(() => mockCompanies.filter(c => c.states.includes(stateCode)), [stateCode])
  const availableBuildings = useMemo(() => mockStrataPlans.filter(p => p.companyId === companyId && p.state === stateCode), [companyId, stateCode])
  const currentBuilding = useMemo(() => mockStrataPlans.find(p => p.id === buildingId), [buildingId])
  const currentCompany = useMemo(() => mockCompanies.find(c => c.id === companyId), [companyId])
  const violationsCount = useMemo(() => Array.from(allRules.values()).filter(v => v.isViolation).length, [allRules])

  const handleStateChange = useCallback((newState: StateCode) => {
    setStateCode(newState)
    const companies = mockCompanies.filter(c => c.states.includes(newState))
    const newCompanyId = companies.find(c => c.id === companyId)?.id ?? companies[0]?.id ?? ''
    setCompanyId(newCompanyId)
    const buildings = mockStrataPlans.filter(p => p.companyId === newCompanyId && p.state === newState)
    setBuildingId(buildings[0]?.id ?? '')
  }, [companyId])

  const handleCompanyChange = useCallback((newCompanyId: string) => {
    setCompanyId(newCompanyId)
    const buildings = mockStrataPlans.filter(p => p.companyId === newCompanyId && p.state === stateCode)
    setBuildingId(buildings[0]?.id ?? '')
  }, [stateCode])

  // Derived rule values for panels
  const noticeDaysMin   = r('agm.noticeDaysMin').value as number
  const quoteThreshold  = r('maintenance.quoteThreshold').value as number
  const urgentWorkMax   = r('maintenance.urgentWorkMax').value as number
  const levyNotice      = r('compliance.levyNoticeDays').value as number
  const interestRateMax = r('arrears.interestRateMaxPercent').value as number
  const legalMinDays    = r('arrears.legalActionMinDays').value as number
  const electronicVoting = r('agm.electronicVotingAllowed').value as boolean

  const totalLots = currentBuilding?.totalLots ?? 1
  const quarterlyTotal = (levyAdminPerLot + levyCwPerLot) * totalLots
  const overdueInterest30d = ((levyAdminPerLot + levyCwPerLot) * 30 / 365 * interestRateMax / 100)

  const agmValid = proposedNoticeDays >= noticeDaysMin
  const needsQuotes = jobCost >= quoteThreshold
  const needsCommittee = jobCost > urgentWorkMax

  const maintWorkflowStatus = needsCommittee ? 'required' : needsQuotes ? 'warn' : 'ok'
  const maintLabel = needsCommittee && needsQuotes
    ? 'Committee approval + 2+ quotes required'
    : needsCommittee
    ? 'Committee approval required'
    : needsQuotes
    ? '2+ quotes required — manager can approve'
    : 'Manager can approve — no quotes needed'

  return (
    <div>
      <TopNav title="Rules Engine" breadcrumb="Governance" />
      <div className="p-6 space-y-5 max-w-6xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-primary" />
              Strata Rules Engine
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Three-layer compliance simulation — L1 State Law · L2 Company Policy · L3 Building Override</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
            ⭐ Not available in IntelliStrata
          </span>
        </div>

        {/* Context Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-blue-700"><span className="text-xs bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 font-bold">L1</span> State</Label>
                <Select value={stateCode} onValueChange={(v) => handleStateChange(v as StateCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIC">Victoria (VIC)</SelectItem>
                    <SelectItem value="NSW">New South Wales (NSW)</SelectItem>
                    <SelectItem value="QLD">Queensland (QLD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-amber-700"><span className="text-xs bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5 font-bold">L2</span> Company</Label>
                <Select value={companyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-green-700"><span className="text-xs bg-green-100 border border-green-200 rounded px-1.5 py-0.5 font-bold">L3</span> Building</Label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableBuildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.totalLots} lots)</SelectItem>
                    ))}
                    {availableBuildings.length === 0 && (
                      <SelectItem value="" disabled>No buildings for this state</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {currentBuilding && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{currentBuilding.name} · {currentBuilding.planNumber}</span>
                <span>{currentBuilding.totalLots} lots</span>
                <span>Admin ${currentBuilding.adminFundBalance.toLocaleString()} · CWF ${currentBuilding.capitalWorksFundBalance.toLocaleString()}</span>
                <span>Manager: {currentCompany?.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violations alert */}
        {violationsCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <span className="font-semibold">{violationsCount} policy violation{violationsCount > 1 ? 's' : ''} detected.</span>{' '}
              {currentCompany?.name} company policy conflicts with {stateCode} state law. State law is automatically enforced — the Final Value column shows the legally valid result.
              {' '}Open the <strong>Rule Inspector</strong> tab for full details.
            </div>
          </div>
        )}

        {/* Panels */}
        <Tabs defaultValue="inspector">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="inspector" className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />Rule Inspector
              {violationsCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{violationsCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="agm">AGM Simulator</TabsTrigger>
            <TabsTrigger value="levy">Levy Generator</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* ── Rule Inspector ── */}
          <TabsContent value="inspector" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Rule Inspector
                </CardTitle>
                <p className="text-sm text-slate-500">Every rule resolved for the current context. Click a row to see the explanation.</p>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Rule</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-blue-600 uppercase tracking-wide">L1 {stateCode}</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-amber-600 uppercase tracking-wide">L2 Company</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-green-600 uppercase tracking-wide">L3 Building</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-700 uppercase tracking-wide">Final</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getAllRulePaths().map(path => {
                      const res = r(path)
                      const meta = getRuleMetadata(path)
                      const isExpanded = expandedRule === path
                      return (
                        <tr
                          key={path}
                          className={`cursor-pointer transition-colors ${res.isViolation ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/80'}`}
                          onClick={() => setExpandedRule(isExpanded ? null : path)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                              <div>
                                <div className="font-medium text-slate-900">{meta.label}</div>
                                {isExpanded && <div className="text-xs text-slate-500 mt-0.5 max-w-xs leading-relaxed">{res.explanation}</div>}
                                <div className="text-xs text-slate-400 font-mono">{path}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatRuleValue(path, res.l1Value)}</td>
                          <td className="px-4 py-3">
                            {res.l2Value !== undefined ? (
                              <span className={`${res.isViolation && res.source !== 'L2' ? 'line-through text-red-400' : 'text-slate-700'} flex items-center gap-1`}>
                                {formatRuleValue(path, res.l2Value)}
                                {res.isViolation && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {res.l3Value !== undefined
                              ? <span className="text-slate-700">{formatRuleValue(path, res.l3Value)}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatRuleValue(path, res.value)}</td>
                          <td className="px-4 py-3"><SourceBadge source={res.source} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AGM Simulator ── */}
          <TabsContent value="agm" className="mt-4">
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Propose an AGM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Proposed Notice Period (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={proposedNoticeDays}
                      onChange={e => setProposedNoticeDays(Number(e.target.value))}
                    />
                    <p className="text-xs text-slate-400">Required minimum: {noticeDaysMin} days (resolved from {r('agm.noticeDaysMin').source})</p>
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${agmValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {agmValid
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    <div className={`text-sm font-medium ${agmValid ? 'text-green-800' : 'text-red-800'}`}>
                      {agmValid
                        ? `✓ Valid — ${proposedNoticeDays}d meets the ${noticeDaysMin}d minimum required by ${r('agm.noticeDaysMin').source}`
                        : `✗ Invalid — ${proposedNoticeDays}d is below the ${noticeDaysMin}d minimum. Increase notice period to at least ${noticeDaysMin} days.`}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 space-y-1">
                    <div className="font-medium text-slate-500 uppercase tracking-wide mb-1.5">Constraint chain</div>
                    <div>L1 ({stateCode} law): {formatRuleValue('agm.noticeDaysMin', r('agm.noticeDaysMin').l1Value)} minimum</div>
                    <div>L2 (company): {r('agm.noticeDaysMin').l2Value !== undefined ? formatRuleValue('agm.noticeDaysMin', r('agm.noticeDaysMin').l2Value) : 'not set'}</div>
                    <div>L3 (building): {r('agm.noticeDaysMin').l3Value !== undefined ? formatRuleValue('agm.noticeDaysMin', r('agm.noticeDaysMin').l3Value) : 'not set'}</div>
                    <div className="font-semibold text-slate-700 border-t border-slate-200 pt-1 mt-1">Final: {formatRuleValue('agm.noticeDaysMin', noticeDaysMin)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resolved AGM Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['agm.noticeDaysMin', 'agm.quorumPercent', 'agm.quorumFallbackMinutes', 'agm.electronicVotingAllowed', 'voting.specialResolutionThreshold', 'voting.ordinaryResolutionThreshold'].map(path => (
                    <RuleRow key={path} path={path} resolution={r(path)} showExplanation={expandedRule === path} />
                  ))}
                  <p className="text-xs text-slate-400 flex items-center gap-1 pt-1"><Info className="w-3 h-3" />Electronic voting: {electronicVoting ? `permitted by ${stateCode} law` : 'this building has opted out'}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Levy Generator ── */}
          <TabsContent value="levy" className="mt-4">
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Levy Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Admin Levy / Lot / Quarter ($)</Label>
                      <Input type="number" value={levyAdminPerLot} onChange={e => setLevyAdminPerLot(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CWF Levy / Lot / Quarter ($)</Label>
                      <Input type="number" value={levyCwPerLot} onChange={e => setLevyCwPerLot(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs text-slate-500">Per Lot / Qtr</div>
                      <div className="font-bold text-slate-900">${(levyAdminPerLot + levyCwPerLot).toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                      <div className="text-xs text-slate-500">Building Total / Qtr</div>
                      <div className="font-bold text-blue-900">${quarterlyTotal.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                      <div className="text-xs text-slate-500">Annual Building</div>
                      <div className="font-bold text-green-900">${(quarterlyTotal * 4).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <div className="font-semibold mb-1">Overdue Scenario (30 days late)</div>
                    <div>Interest per lot: <strong>${overdueInterest30d.toFixed(2)}</strong> ({interestRateMax}% p.a. max — <SourceBadge source={r('arrears.interestRateMaxPercent').source} />)</div>
                    <div className="text-xs text-amber-700 mt-1">Legal action permitted after {legalMinDays} days from due date</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resolved Levy Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['compliance.levyNoticeDays', 'arrears.interestRateMaxPercent', 'arrears.legalActionMinDays', 'funds.capitalWorksRequired', 'funds.adminFundMinMonths'].map(path => (
                    <RuleRow key={path} path={path} resolution={r(path)} />
                  ))}
                  <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                    <Info className="w-3 h-3" />Levies must be issued at least {levyNotice} days before the due date ({r('compliance.levyNoticeDays').source})
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Maintenance Module ── */}
          <TabsContent value="maintenance" className="mt-4">
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Maintenance Job Workflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Estimated Job Cost ($)</Label>
                    <Input type="number" value={jobCost} onChange={e => setJobCost(Number(e.target.value))} />
                  </div>

                  <div className="space-y-2">
                    <WorkflowStep
                      step={1}
                      label="Cost Assessment"
                      status="neutral"
                      detail={`Job cost: $${jobCost.toLocaleString()} · Quote threshold: ${formatRuleValue('maintenance.quoteThreshold', quoteThreshold)} · Urgent limit: ${formatRuleValue('maintenance.urgentWorkMax', urgentWorkMax)}`}
                    />
                    <WorkflowStep
                      step={2}
                      label={needsQuotes ? 'Obtain 2+ Quotes (Required)' : 'Quote Requirement'}
                      status={needsQuotes ? 'warn' : 'ok'}
                      detail={needsQuotes
                        ? `$${jobCost.toLocaleString()} ≥ ${formatRuleValue('maintenance.quoteThreshold', quoteThreshold)} threshold — must obtain at least 2 competitive quotes before proceeding (${r('maintenance.quoteThreshold').source})`
                        : `$${jobCost.toLocaleString()} < ${formatRuleValue('maintenance.quoteThreshold', quoteThreshold)} threshold — quotes not required (${r('maintenance.quoteThreshold').source})`}
                    />
                    <WorkflowStep
                      step={3}
                      label={needsCommittee ? 'Committee Vote Required' : 'Manager Approval'}
                      status={maintWorkflowStatus}
                      detail={needsCommittee
                        ? `$${jobCost.toLocaleString()} > ${formatRuleValue('maintenance.urgentWorkMax', urgentWorkMax)} limit — requires committee resolution before work commences (${r('maintenance.urgentWorkMax').source})`
                        : `$${jobCost.toLocaleString()} ≤ ${formatRuleValue('maintenance.urgentWorkMax', urgentWorkMax)} — strata manager can approve without committee vote (${r('maintenance.urgentWorkMax').source})`}
                    />
                    <div className={`p-3 rounded-lg border font-medium text-sm ${maintWorkflowStatus === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : maintWorkflowStatus === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {maintLabel}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resolved Maintenance Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['maintenance.quoteThreshold', 'maintenance.urgentWorkMax'].map(path => (
                    <RuleRow key={path} path={path} resolution={r(path)} showExplanation />
                  ))}
                  <div className="pt-2 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1"><Info className="w-3 h-3" />Lower quote threshold = stricter (more jobs require quotes)</p>
                    <p className="flex items-center gap-1"><Info className="w-3 h-3" />Lower urgent work limit = stricter (more jobs need committee approval)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Compliance Panel ── */}
          <TabsContent value="compliance" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-xs bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 font-bold text-blue-700">L1</span>
                    {stateCode} State Law
                  </CardTitle>
                  <p className="text-xs text-slate-500">Minimum legal requirements — cannot be reduced</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { path: 'agm.noticeDaysMin', icon: '📅' },
                    { path: 'agm.quorumPercent', icon: '👥' },
                    { path: 'compliance.retentionYears', icon: '📂' },
                    { path: 'compliance.levyNoticeDays', icon: '📬' },
                    { path: 'arrears.legalActionMinDays', icon: '⚖️' },
                    { path: 'maintenance.quoteThreshold', icon: '🔧' },
                    { path: 'funds.capitalWorksRequired', icon: '🏗️' },
                  ].map(({ path, icon }) => {
                    const meta = getRuleMetadata(path)
                    const res = r(path)
                    return (
                      <div key={path} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-600">{icon} {meta.label}</span>
                        <span className="font-semibold text-slate-900">{formatRuleValue(path, res.l1Value)}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-xs bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-amber-700">L2</span>
                    {currentCompany?.name ?? 'Company Policy'}
                  </CardTitle>
                  <p className="text-xs text-slate-500">Policies applied on top of state law</p>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {getAllRulePaths().map(path => {
                    const res = r(path)
                    if (res.l2Value === undefined) return null
                    const meta = getRuleMetadata(path)
                    const isViol = res.isViolation && res.source !== 'L2'
                    return (
                      <div key={path} className={`flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0 ${isViol ? 'text-red-600' : ''}`}>
                        <div className="flex items-center gap-1">
                          {isViol ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <span className="text-green-500">↑</span>}
                          <span className={isViol ? 'text-red-600' : 'text-slate-600'}>{meta.label}</span>
                        </div>
                        <span className={`font-semibold ${isViol ? 'line-through text-red-400' : 'text-slate-900'}`}>
                          {formatRuleValue(path, res.l2Value)}
                        </span>
                      </div>
                    )
                  })}
                  {violationsCount > 0 && (
                    <div className="pt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {violationsCount} policy conflict{violationsCount > 1 ? 's' : ''} — state law enforced
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-xs bg-green-100 border border-green-200 rounded px-1.5 py-0.5 font-bold text-green-700">L3</span>
                    {currentBuilding?.name ?? 'Building Overrides'}
                  </CardTitle>
                  <p className="text-xs text-slate-500">Building-specific settings — cannot violate L1</p>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {getAllRulePaths().map(path => {
                    const res = r(path)
                    if (res.l3Value === undefined) return null
                    const meta = getRuleMetadata(path)
                    return (
                      <div key={path} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">↑</span>
                          <span className="text-slate-600">{meta.label}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{formatRuleValue(path, res.l3Value)}</span>
                      </div>
                    )
                  })}
                  {getAllRulePaths().every(path => r(path).l3Value === undefined) && (
                    <p className="text-xs text-slate-400 text-center py-4">No building overrides configured</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary table */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Final Resolved Rules — All Paths</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-y border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Rule</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Constraint</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Final Value</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {getAllRulePaths().map(path => {
                      const res = r(path)
                      const meta = getRuleMetadata(path)
                      return (
                        <tr key={path} className={res.isViolation ? 'bg-red-50/30' : ''}>
                          <td className="px-4 py-2 font-medium text-slate-800">{meta.label}</td>
                          <td className="px-4 py-2">
                            <Badge variant={meta.constraint === 'fixed' ? 'default' : meta.constraint === 'minimum' ? 'success' : meta.constraint === 'maximum' ? 'warning' : 'secondary'} className="text-xs">
                              {meta.constraint}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-900">{formatRuleValue(path, res.value)}</td>
                          <td className="px-4 py-2 flex items-center gap-1.5">
                            <SourceBadge source={res.source} />
                            {res.isViolation && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
