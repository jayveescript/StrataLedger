"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { CapitalWorksForecastChart } from "@/components/charts/CapitalWorksForecastChart"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { mockCapitalWorksItems } from "@/lib/mock-data/capital-works"
import { formatCurrency } from "@/lib/utils"
import { Plus, CheckCircle2 } from "lucide-react"

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") return <Badge variant="destructive">High</Badge>
  if (priority === "medium") return <Badge variant="warning">Medium</Badge>
  return <Badge variant="success">Low</Badge>
}

const PLANNED_YEARS = Array.from({ length: 15 }, (_, i) => 2026 + i)

interface AddItemForm {
  description: string
  estimatedCost: string
  plannedYear: string
  priority: string
  notes: string
}

const EMPTY_FORM: AddItemForm = {
  description: "",
  estimatedCost: "",
  plannedYear: "2026",
  priority: "medium",
  notes: "",
}

export default function CapitalWorksPage() {
  const [selectedPlan, setSelectedPlan] = useState("1")
  const [levyPerLot, setLevyPerLot] = useState([400])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<AddItemForm>(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<AddItemForm>>({})

  const plan = mockStrataPlans.find(p => p.id === selectedPlan) ?? mockStrataPlans[0]
  const items = mockCapitalWorksItems.filter(i => i.strataplanId === selectedPlan)
  const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0)
  const currentBalance = plan.capitalWorksFundBalance
  const projectedShortfall = totalEstimated - currentBalance
  const yearsUntilDeficit = levyPerLot[0] >= 438 ? "solvent through 2033" : "deficit projected 2029"

  function openDialog() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitted(false)
    setDialogOpen(true)
  }

  function closeAndReset() {
    setDialogOpen(false)
    setSubmitted(false)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  function validate(): boolean {
    const next: Partial<AddItemForm> = {}
    if (!form.description.trim()) next.description = "Item description is required."
    if (!form.estimatedCost || isNaN(Number(form.estimatedCost)) || Number(form.estimatedCost) < 0) {
      next.estimatedCost = "A valid estimated cost (≥ 0) is required."
    }
    if (!form.plannedYear) next.plannedYear = "Planned year is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
  }

  return (
    <div>
      <TopNav title="Capital Works" breadcrumb="Planning" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Strata Plan</label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockStrataPlans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Fund Health</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-slate-900 mb-1">{formatCurrency(currentBalance)}</div>
                <div className="text-sm text-slate-500">Current Balance</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">10-year planned expenditure</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(totalEstimated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Projected shortfall</span>
                  <span className="font-semibold text-red-600">{formatCurrency(Math.max(0, projectedShortfall))}</span>
                </div>
              </div>
              <div className={`rounded-lg p-4 text-center font-bold text-lg ${
                projectedShortfall > 0
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {projectedShortfall > 0 ? "⚠️ AT RISK" : "✅ FUNDED"}
              </div>
              {projectedShortfall > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed">
                  <div className="font-semibold mb-1">Recommendation</div>
                  To cover all planned expenditure without a special levy, increase quarterly contributions by <strong>$38.50/lot</strong>.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>10-Year Fund Forecast</CardTitle>
                <Badge variant="destructive" className="text-xs">Deficit projected 2029</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CapitalWorksForecastChart levyPerLot={levyPerLot[0]} />
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-900 text-sm mb-3">What-If Modeller</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Quarterly levy per lot</span>
                    <span className="font-bold text-blue-700 text-base">{formatCurrency(levyPerLot[0])}</span>
                  </div>
                  <Slider
                    value={levyPerLot}
                    onValueChange={setLevyPerLot}
                    min={200}
                    max={800}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-blue-700 font-medium">
                    At this rate, fund remains <strong>{yearsUntilDeficit}</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>10-Year Maintenance Schedule</CardTitle>
              <Button size="sm" onClick={openDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Year", "Item", "Estimated Cost", "Priority", "Notes"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.sort((a, b) => a.plannedYear - b.plannedYear).map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${item.priority === "high" ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.plannedYear}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.item}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(item.estimatedCost)}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-slate-900">Total</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(totalEstimated)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeAndReset() }}>
        <DialogContent className="max-w-lg">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <div>
                <div className="text-lg font-semibold text-slate-900 mb-1">Item Added</div>
                <div className="text-sm text-slate-500">Capital works item added to the 10-year schedule.</div>
              </div>
              <Button onClick={closeAndReset} className="mt-2">Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Capital Works Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the 10-year maintenance schedule for {plan.name}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* Item Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="cw-description">Item Description <span className="text-red-500">*</span></Label>
                  <Input
                    id="cw-description"
                    placeholder="e.g. Roof replacement"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                {/* Estimated Cost */}
                <div className="space-y-1.5">
                  <Label htmlFor="cw-cost">Estimated Cost <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <Input
                      id="cw-cost"
                      type="number"
                      min={0}
                      step={100}
                      placeholder="0.00"
                      className="pl-7"
                      value={form.estimatedCost}
                      onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
                    />
                  </div>
                  {errors.estimatedCost && <p className="text-xs text-red-500">{errors.estimatedCost}</p>}
                </div>

                {/* Planned Year + Priority side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cw-year">Planned Year <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.plannedYear}
                      onValueChange={v => setForm(f => ({ ...f, plannedYear: v }))}
                    >
                      <SelectTrigger id="cw-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANNED_YEARS.map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.plannedYear && <p className="text-xs text-red-500">{errors.plannedYear}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cw-priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={v => setForm(f => ({ ...f, priority: v }))}
                    >
                      <SelectTrigger id="cw-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="cw-notes">Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Textarea
                    id="cw-notes"
                    placeholder="Contractor quotes, scope notes..."
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeAndReset}>Cancel</Button>
                  <Button type="submit">Add Item</Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
