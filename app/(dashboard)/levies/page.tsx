"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockLots } from "@/lib/mock-data/lots"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, DollarSign, AlertTriangle, TrendingDown, Bell, CheckSquare } from "lucide-react"

function LevyBadge({ status }: { status: string }) {
  switch (status) {
    case "paid": return <Badge variant="success">Paid</Badge>
    case "overdue": return <Badge variant="destructive">Overdue</Badge>
    case "unpaid": return <Badge variant="warning">Unpaid</Badge>
    case "partial": return <Badge variant="default">Partial</Badge>
    default: return null
  }
}

export default function LeviesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

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
          <Button>Issue Q4 Levies</Button>
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
                            <Button size="sm" variant="outline" className="text-xs">
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
    </div>
  )
}
