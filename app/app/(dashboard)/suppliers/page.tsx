"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Plus, Wrench, Star } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { mockSuppliers, mockWorkOrders, mockQuotes } from "@/lib/mock-data/suppliers"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

// ---------- Types ----------
type WorkOrderStatus = "draft" | "sent" | "accepted" | "in-progress" | "completed" | "invoiced"
type Priority = "urgent" | "normal" | "low"

type CreateWOForm = {
  planId: string
  supplierId: string
  description: string
  priority: Priority | ""
  notes: string
}

const defaultCreateWOForm: CreateWOForm = {
  planId: "",
  supplierId: "",
  description: "",
  priority: "",
  notes: "",
}

// ---------- Helpers ----------
function statusBadgeVariant(status: WorkOrderStatus): "secondary" | "warning" | "default" | "success" {
  switch (status) {
    case "draft":       return "secondary"
    case "sent":        return "warning"
    case "accepted":    return "default"
    case "in-progress": return "default"
    case "completed":   return "success"
    case "invoiced":    return "success"
  }
}

function statusLabel(status: WorkOrderStatus): string {
  if (status === "in-progress") return "In Progress"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function StarRating({ rating }: { rating: number }) {
  return <span className="text-amber-400 tracking-tight">{"⭐".repeat(rating)}</span>
}

// ---------- Quote Comparison Dialog ----------
type QuoteComparisonDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function QuoteComparisonDialog({ open, onOpenChange }: QuoteComparisonDialogProps) {
  const [acceptedQuote, setAcceptedQuote] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function handleAccept(supplier: string) {
    setAcceptedQuote(supplier)
    setToastMsg(`Quote from ${supplier} accepted for WO-002`)
    setTimeout(() => setToastMsg(null), 4000)
  }

  function handleClose(v: boolean) {
    if (!v) {
      setAcceptedQuote(null)
      setToastMsg(null)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quote Comparison — WO-002: Annual Lift Inspection</DialogTitle>
          <DialogDescription>
            Compare quotes received for the annual lift inspection at Southbank Residences.
          </DialogDescription>
        </DialogHeader>

        {toastMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            {toastMsg}
          </div>
        )}

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-32 border-b border-slate-200"></th>
                {mockQuotes.map((q) => (
                  <th
                    key={q.supplier}
                    className={`px-4 py-3 text-center text-sm font-semibold text-slate-900 border-b border-slate-200 ${
                      q.recommended ? "bg-green-50" : ""
                    }`}
                  >
                    <div>{q.supplier}</div>
                    {q.recommended && (
                      <Badge variant="success" className="mt-1 text-xs">Recommended</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Amount */}
              <tr>
                <td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center font-semibold text-slate-900 ${
                      q.recommended ? "bg-green-50" : ""
                    }`}
                  >
                    {formatCurrency(q.amount)}
                  </td>
                ))}
              </tr>
              {/* Lead Time */}
              <tr>
                <td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Lead Time</td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center text-slate-700 ${
                      q.recommended ? "bg-green-50" : ""
                    }`}
                  >
                    {q.leadTime}
                  </td>
                ))}
              </tr>
              {/* Warranty */}
              <tr>
                <td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Warranty</td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center text-slate-700 ${
                      q.recommended ? "bg-green-50" : ""
                    }`}
                  >
                    {q.warranty}
                  </td>
                ))}
              </tr>
              {/* Rating */}
              <tr>
                <td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Rating</td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center ${q.recommended ? "bg-green-50" : ""}`}
                  >
                    <StarRating rating={q.rating} />
                  </td>
                ))}
              </tr>
              {/* Recommended */}
              <tr>
                <td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Recommended</td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center ${q.recommended ? "bg-green-50" : ""}`}
                  >
                    {q.recommended ? (
                      <Badge variant="success">Yes</Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                ))}
              </tr>
              {/* Accept Quote row */}
              <tr>
                <td className="px-4 py-3"></td>
                {mockQuotes.map((q) => (
                  <td
                    key={q.supplier}
                    className={`px-4 py-3 text-center ${q.recommended ? "bg-green-50" : ""}`}
                  >
                    {acceptedQuote === q.supplier ? (
                      <Badge variant="success" className="text-xs">Accepted</Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        disabled={acceptedQuote !== null && acceptedQuote !== q.supplier}
                        onClick={() => handleAccept(q.supplier)}
                      >
                        Accept Quote
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <Button variant="outline" className="w-full text-sm">
            Request Another Quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Create Work Order Dialog ----------
type CreateWODialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function CreateWorkOrderDialog({ open, onOpenChange }: CreateWODialogProps) {
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<CreateWOForm>(defaultCreateWOForm)

  function reset() {
    setForm(defaultCreateWOForm)
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <DialogHeader>
              <DialogTitle>Work Order Created</DialogTitle>
              <DialogDescription>
                Work order created successfully. The supplier will be notified shortly.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>Issue a new work order to a registered supplier.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="cwo-plan">Plan <span className="text-red-500">*</span></Label>
                <Select
                  value={form.planId}
                  onValueChange={(v) => setForm((f) => ({ ...f, planId: v }))}
                  required
                >
                  <SelectTrigger id="cwo-plan"><SelectValue placeholder="Select strata plan" /></SelectTrigger>
                  <SelectContent>
                    {mockStrataPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cwo-supplier">Supplier <span className="text-red-500">*</span></Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}
                  required
                >
                  <SelectTrigger id="cwo-supplier"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {mockSuppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.company} — {s.trade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cwo-description">Description <span className="text-red-500">*</span></Label>
                <Input
                  id="cwo-description"
                  placeholder="e.g. Quarterly fire system inspection"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cwo-priority">Priority <span className="text-red-500">*</span></Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                  required
                >
                  <SelectTrigger id="cwo-priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cwo-notes">Notes <span className="text-slate-400 text-xs font-normal">(optional)</span></Label>
                <Textarea
                  id="cwo-notes"
                  rows={3}
                  placeholder="Any additional instructions or site access notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Create Work Order</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Page ----------
export default function SuppliersPage() {
  const [quotesOpen, setQuotesOpen] = useState(false)
  const [createWOOpen, setCreateWOOpen] = useState(false)

  return (
    <div>
      <TopNav title="Suppliers & Work Orders" breadcrumb="Operations" />
      <div className="p-6 space-y-8">

        {/* ── Supplier Register ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Supplier Register</h2>
            <Badge variant="secondary" className="ml-1">{mockSuppliers.length} suppliers</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Company", "ABN", "Trade Type", "Contact", "Rating", "Active Jobs", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.company}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{s.abn}</td>
                      <td className="px-4 py-3 text-slate-700">{s.trade}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">{s.contact}</div>
                        <div className="text-slate-400 text-xs">{s.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StarRating rating={s.rating} />
                      </td>
                      <td className="px-4 py-3">
                        {s.activeJobs > 0 ? (
                          <Badge variant="default">{s.activeJobs} active</Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="text-xs">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* ── Work Orders ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Work Orders</h2>
              <Badge variant="secondary" className="ml-1">{mockWorkOrders.length} orders</Badge>
            </div>
            <Button onClick={() => setCreateWOOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Work Order
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["WO #", "Plan", "Supplier", "Description", "Status", "Quote", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockWorkOrders.map((wo) => {
                    const status = wo.status as WorkOrderStatus
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{wo.id}</td>
                        <td className="px-4 py-3 text-slate-700 text-xs max-w-[140px] truncate">{wo.planName}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{wo.supplierName}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px] truncate">{wo.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(wo.quote)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-xs">View</Button>
                            {wo.id === "WO-002" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setQuotesOpen(true)}
                              >
                                Quotes (3)
                              </Button>
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

      </div>

      <QuoteComparisonDialog open={quotesOpen} onOpenChange={setQuotesOpen} />
      <CreateWorkOrderDialog open={createWOOpen} onOpenChange={setCreateWOOpen} />
    </div>
  )
}
