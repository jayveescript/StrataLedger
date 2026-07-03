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
import { mockCommissionDisclosures } from "@/lib/mock-data/commission"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CheckCircle2, Plus, Download, Info, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"

// ---------- Types ----------
type DisclosureForm = {
  strataplanId: string
  contractor: string
  service: string
  invoiceAmount: string
  referralFee: string
  confirmed: boolean
}

const defaultForm: DisclosureForm = {
  strataplanId: "",
  contractor: "",
  service: "",
  invoiceAmount: "",
  referralFee: "",
  confirmed: false,
}

// ---------- Add Disclosure Dialog ----------
function AddDisclosureDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<DisclosureForm>(defaultForm)

  function reset() {
    setForm(defaultForm)
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
              <DialogTitle>Disclosure Recorded</DialogTitle>
              <DialogDescription>
                Disclosure recorded and owners notified
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add Disclosure</DialogTitle>
              <DialogDescription>
                Record a new commission or referral fee disclosure.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <Label htmlFor="ad-plan">
                  Strata Plan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.strataplanId}
                  onValueChange={(v) => setForm((f) => ({ ...f, strataplanId: v }))}
                  required
                >
                  <SelectTrigger id="ad-plan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {mockStrataPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-contractor">
                  Contractor / Company <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ad-contractor"
                  placeholder="e.g. CleanPro Services"
                  value={form.contractor}
                  onChange={(e) => setForm((f) => ({ ...f, contractor: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-service">
                  Service Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ad-service"
                  placeholder="e.g. Cleaning contract"
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-invoice">
                    Invoice Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <Input
                      id="ad-invoice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={form.invoiceAmount}
                      onChange={(e) => setForm((f) => ({ ...f, invoiceAmount: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-fee">
                    Referral Fee Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <Input
                      id="ad-fee"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={form.referralFee}
                      onChange={(e) => setForm((f) => ({ ...f, referralFee: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 w-4 h-4 mt-0.5 flex-shrink-0"
                    checked={form.confirmed}
                    onChange={(e) => setForm((f) => ({ ...f, confirmed: e.target.checked }))}
                    required
                  />
                  <span className="text-sm text-slate-700">
                    I confirm this disclosure has been communicated to the owners corporation
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!form.confirmed}>
                  Record Disclosure
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Page ----------
export default function CommissionRegisterPage() {
  const [ownerView, setOwnerView] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [expandWhatMeans, setExpandWhatMeans] = useState(false)

  const totalFees = mockCommissionDisclosures.reduce((sum, d) => sum + d.referralFee, 0)
  const allNotified = mockCommissionDisclosures.every((d) => d.ownerNotified)
  const lastDisclosure = mockCommissionDisclosures.reduce((latest, d) =>
    d.date > latest.date ? d : latest
  )

  function handleDownload() {
    setToast("PDF generating...")
    setTimeout(() => setToast(""), 3000)
  }

  return (
    <div>
      <TopNav title="Commission & Referral Fee Register" breadcrumb="Transparency" />

      <div className="p-6 space-y-6">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">Commission &amp; Referral Fee Register</h1>
              <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium px-2.5 py-0.5">
                ⭐ Not available in IntelliStrata
              </span>
            </div>
            <p className="text-sm text-slate-500">
              All referral fees disclosed by your strata manager — as required under the Owners Corporations Act 2006
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setOwnerView((v) => !v)}
              className="gap-2"
            >
              {ownerView ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Manager View
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Owner View
                </>
              )}
            </Button>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Disclosure
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download Disclosure Report
            </Button>
          </div>
        </div>

        {/* Info alert banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <span>
            Under the Owners Corporations Act 2006 and proposed 2025 reforms, all referral fees and commissions
            received by strata managers must be disclosed to owners. This register is visible to all lot owners.
          </span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-slate-500 font-medium mb-1">Total Disclosed This FY</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalFees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-slate-500 font-medium mb-1">Number of Disclosures</div>
              <div className="text-2xl font-bold text-slate-900">{mockCommissionDisclosures.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-slate-500 font-medium mb-1">All Owners Notified</div>
              <div className={`text-2xl font-bold ${allNotified ? "text-green-600" : "text-red-600"}`}>
                {allNotified ? "✅ Yes" : "❌ No"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-slate-500 font-medium mb-1">Last Disclosure</div>
              <div className="text-2xl font-bold text-slate-900">{formatDate(lastDisclosure.date)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Manager view table */}
        {!ownerView && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Date", "Strata Plan", "Contractor", "Service", "Invoice Amount", "Referral Fee", "Fee %", "Disclosed By", "Owner Notified"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockCommissionDisclosures.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-slate-900">
                        <div className="font-medium">{d.planName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap">{d.contractor}</td>
                      <td className="px-4 py-3 text-slate-700">{d.service}</td>
                      <td className="px-4 py-3 text-slate-900 font-semibold whitespace-nowrap">
                        {formatCurrency(d.invoiceAmount)}
                        {d.strataplanId === "all" && (
                          <span className="ml-1 text-xs text-slate-400 font-normal">/yr</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-semibold whitespace-nowrap">
                        {formatCurrency(d.referralFee)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {d.feePercent.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{d.disclosedBy}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {d.ownerNotified ? (
                          <span className="text-green-600 font-medium">✅ Yes</span>
                        ) : (
                          <span className="text-red-600 font-medium">❌ No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Owner view */}
        {ownerView && (
          <div className="space-y-4">
            {/* Yellow info box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Your strata manager has received the following payments from contractors they recommended to your
              building. These are disclosed as required by law.
            </div>

            {/* Simplified table */}
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Date", "Contractor", "Service", "Fee Received", "Disclosed?"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockCommissionDisclosures.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(d.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{d.contractor}</td>
                        <td className="px-4 py-3 text-slate-700">{d.service}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(d.referralFee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {d.ownerNotified ? (
                            <span className="text-green-600 font-medium">✅ Yes</span>
                          ) : (
                            <span className="text-red-600 font-medium">❌ No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Expandable "What does this mean for me?" */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                onClick={() => setExpandWhatMeans((v) => !v)}
              >
                <span>What does this mean for me?</span>
                {expandWhatMeans ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {expandWhatMeans && (
                <div className="px-4 py-4 text-sm text-slate-600 bg-white border-t border-slate-200">
                  Your strata manager received these payments from contractors they recommended to your building.
                  By law, these must be disclosed to you. The commission register ensures full transparency about
                  any potential conflicts of interest.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AddDisclosureDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
