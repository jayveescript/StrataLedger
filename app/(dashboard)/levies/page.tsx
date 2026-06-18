"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockLots } from "@/lib/mock-data/lots"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, DollarSign, AlertTriangle, TrendingDown, Bell, CheckSquare, CheckCircle2 } from "lucide-react"

const TODAY = "2026-06-18"

function LevyBadge({ status }: { status: string }) {
  switch (status) {
    case "paid": return <Badge variant="success">Paid</Badge>
    case "overdue": return <Badge variant="destructive">Overdue</Badge>
    case "unpaid": return <Badge variant="warning">Unpaid</Badge>
    case "partial": return <Badge variant="default">Partial</Badge>
    default: return null
  }
}

// ---------- Issue Levy Dialog ----------
type IssueLevyForm = {
  strataplanId: string
  quarter: string
  fundType: string
  adminAmount: string
  capitalAmount: string
  dueDate: string
  issueDate: string
}

const defaultIssueLevyForm: IssueLevyForm = {
  strataplanId: "",
  quarter: "",
  fundType: "both",
  adminAmount: "",
  capitalAmount: "",
  dueDate: "",
  issueDate: TODAY,
}

function IssueLevyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<IssueLevyForm>(defaultIssueLevyForm)

  function reset() {
    setForm(defaultIssueLevyForm)
    setSuccess(false)
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(true)
  }

  const plan = mockStrataPlans.find(p => p.id === form.strataplanId)
  const adminDisabled = form.fundType === "capital"
  const capitalDisabled = form.fundType === "admin"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <DialogHeader>
              <DialogTitle>Levies Issued Successfully</DialogTitle>
              <DialogDescription>
                {form.quarter} levies have been issued
                {plan ? ` for ${plan.name}` : ""} and are ready for distribution.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Issue Q4 Levies</DialogTitle>
              <DialogDescription>Issue levies to all lot owners for the selected quarter and plan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="il-plan">Strata Plan <span className="text-red-500">*</span></Label>
                <Select
                  value={form.strataplanId}
                  onValueChange={v => setForm(f => ({ ...f, strataplanId: v }))}
                  required
                >
                  <SelectTrigger id="il-plan"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                  <SelectContent>
                    {mockStrataPlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="il-quarter">Quarter <span className="text-red-500">*</span></Label>
                <Input
                  id="il-quarter"
                  placeholder="Q4 FY2026"
                  value={form.quarter}
                  onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="il-fund">Fund Type <span className="text-red-500">*</span></Label>
                <Select value={form.fundType} onValueChange={v => setForm(f => ({ ...f, fundType: v }))}>
                  <SelectTrigger id="il-fund"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Funds</SelectItem>
                    <SelectItem value="admin">Admin Fund Only</SelectItem>
                    <SelectItem value="capital">Capital Works Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="il-admin">Admin Fund per Lot <span className="text-red-500">*</span></Label>
                  <Input
                    id="il-admin"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="850.00"
                    value={form.adminAmount}
                    onChange={e => setForm(f => ({ ...f, adminAmount: e.target.value }))}
                    required={!adminDisabled}
                    disabled={adminDisabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="il-capital">Capital Works per Lot <span className="text-red-500">*</span></Label>
                  <Input
                    id="il-capital"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="400.00"
                    value={form.capitalAmount}
                    onChange={e => setForm(f => ({ ...f, capitalAmount: e.target.value }))}
                    required={!capitalDisabled}
                    disabled={capitalDisabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="il-due">Due Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="il-due"
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="il-issue">Issue Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="il-issue"
                    type="date"
                    value={form.issueDate}
                    onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Issue Levies</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Record Payment Dialog ----------
type Levy = typeof mockLevies[0]

type RecordPaymentForm = {
  amount: string
  paymentDate: string
  method: string
  reference: string
  notes: string
}

const defaultPaymentForm: RecordPaymentForm = {
  amount: "",
  paymentDate: TODAY,
  method: "eft",
  reference: "",
  notes: "",
}

function RecordPaymentDialog({
  levy,
  onOpenChange,
}: {
  levy: Levy | null
  onOpenChange: (v: boolean) => void
}) {
  const open = levy !== null
  const outstanding = levy ? levy.amount - levy.paidAmount : 0

  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<RecordPaymentForm>(defaultPaymentForm)

  function reset() {
    setForm(defaultPaymentForm)
    setSuccess(false)
  }

  function handleClose(v: boolean) {
    if (!v) {
      reset()
      onOpenChange(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(true)
  }

  const lot = levy ? mockLots.find(l => l.id === levy.lotId) : null
  const owner = levy ? mockOwners.find(o => o.id === levy.ownerId) : null
  const displayAmount = form.amount ? formatCurrency(parseFloat(form.amount)) : ""

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <DialogHeader>
              <DialogTitle>Payment Recorded</DialogTitle>
              <DialogDescription>
                {displayAmount && <>{displayAmount} payment for</>}{" "}
                {lot?.lotNumber ?? levy?.reference} has been recorded successfully.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {lot?.lotNumber && owner
                  ? `${lot.lotNumber} — ${owner.firstName} ${owner.lastName} (${levy?.reference})`
                  : levy?.reference ?? ""}
              </DialogDescription>
            </DialogHeader>

            {levy && (
              <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <span className="text-slate-500">Outstanding balance</span>
                <span className="font-semibold text-slate-900">{formatCurrency(outstanding)}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rp-amount">Amount Paid <span className="text-red-500">*</span></Label>
                <Input
                  id="rp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={outstanding > 0 ? outstanding.toFixed(2) : "0.00"}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-date">Payment Date <span className="text-red-500">*</span></Label>
                <Input
                  id="rp-date"
                  type="date"
                  value={form.paymentDate}
                  onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-method">Payment Method <span className="text-red-500">*</span></Label>
                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger id="rp-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eft">EFT / Direct Debit</SelectItem>
                    <SelectItem value="bpay">BPay</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-ref">
                  Reference Number{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="rp-ref"
                  placeholder="e.g. BSB/Acc or receipt number"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-notes">
                  Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="rp-notes"
                  placeholder="Any additional notes"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Record Payment</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Page ----------
export default function LeviesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [issueLevyOpen, setIssueLevyOpen] = useState(false)
  const [paymentLevy, setPaymentLevy] = useState<typeof mockLevies[0] | null>(null)

  const totalIssued = mockLevies.reduce((s, l) => s + l.amount, 0)
  const totalCollected = mockLevies.filter(l => l.status === "paid").reduce((s, l) => s + l.paidAmount, 0)
  const totalOutstanding = mockLevies.filter(l => l.status !== "paid").reduce((s, l) => s + l.amount - l.paidAmount, 0)
  const totalOverdue = mockLevies.filter(l => l.status === "overdue").reduce((s, l) => s + l.amount, 0)

  const filtered = mockLevies.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false
    if (planFilter !== "all" && l.strataplanId !== planFilter) return false
    if (search) {
      const lot = mockLots.find(lot => lot.id === l.lotId)
      const owner = mockOwners.find(o => o.id === l.ownerId)
      const searchText = `${lot?.lotNumber} ${owner?.firstName} ${owner?.lastName} ${l.reference}`.toLowerCase()
      if (!searchText.includes(search.toLowerCase())) return false
    }
    return true
  })

  return (
    <div>
      <TopNav title="Levies" breadcrumb="Financial" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Total Issued</div>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalIssued)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Total Collected</div>
                <CheckSquare className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Outstanding</div>
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Overdue</div>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by lot, owner or reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {mockStrataPlans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIssueLevyOpen(true)}>Issue Q4 Levies</Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["", "Reference", "Plan", "Lot", "Owner", "Amount", "Due Date", "Status", "Paid Date", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((levy) => {
                  const lot = mockLots.find(l => l.id === levy.lotId)
                  const owner = mockOwners.find(o => o.id === levy.ownerId)
                  const plan = mockStrataPlans.find(p => p.id === levy.strataplanId)
                  return (
                    <tr key={levy.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <input type="checkbox" className="rounded border-slate-300 w-4 h-4" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{levy.reference}</td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{plan?.name.split(" ")[0]}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{lot?.lotNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {owner ? `${owner.firstName} ${owner.lastName}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(levy.amount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(levy.dueDate)}</td>
                      <td className="px-4 py-3"><LevyBadge status={levy.status} /></td>
                      <td className="px-4 py-3 text-slate-700">{levy.paidDate ? formatDate(levy.paidDate) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {levy.status === "overdue" && (
                            <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-600">
                              <Bell className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          )}
                          {(levy.status === "unpaid" || levy.status === "partial") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => setPaymentLevy(levy)}
                            >
                              Record Payment
                            </Button>
                          )}
                          {levy.status === "paid" && (
                            <Button size="sm" variant="ghost" className="text-xs">View</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <IssueLevyDialog open={issueLevyOpen} onOpenChange={setIssueLevyOpen} />
      <RecordPaymentDialog levy={paymentLevy} onOpenChange={() => setPaymentLevy(null)} />
    </div>
  )
}
