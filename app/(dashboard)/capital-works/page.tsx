"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { CapitalWorksForecastChart } from "@/components/charts/CapitalWorksForecastChart"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { mockCapitalWorksItems } from "@/lib/mock-data/capital-works"
import { formatCurrency } from "@/lib/utils"
import { Plus } from "lucide-react"

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") return <Badge variant="destructive">High</Badge>
  if (priority === "medium") return <Badge variant="warning">Medium</Badge>
  return <Badge variant="success">Low</Badge>
}

export default function CapitalWorksPage() {
  const [selectedPlan, setSelectedPlan] = useState("1")
  const [levyPerLot, setLevyPerLot] = useState([400])

  const plan = mockStrataPlans.find(p => p.id === selectedPlan) ?? mockStrataPlans[0]
  const items = mockCapitalWorksItems.filter(i => i.strataplanId === selectedPlan)
  const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0)
  const currentBalance = plan.capitalWorksFundBalance
  const projectedShortfall = totalEstimated - currentBalance
  const yearsUntilDeficit = levyPerLot[0] >= 438 ? "solvent through 2033" : "deficit projected 2029"

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
              <Button size="sm">
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
    </div>
  )
}
