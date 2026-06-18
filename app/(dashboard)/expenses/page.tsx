"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { mockExpenses } from "@/lib/mock-data/expenses"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, AlertTriangle, DollarSign, Clock, CheckCircle2, XCircle, Plus } from "lucide-react"

export default function ExpensesPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const totalYTD = mockExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0)
  const pendingApproval = mockExpenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0)
  const commissionTotal = mockExpenses.filter(e => e.isCommissionRelated).reduce((s, e) => s + (e.commissionAmount || 0), 0)
  const commissionCount = mockExpenses.filter(e => e.isCommissionRelated).length

  const pendingExpenses = mockExpenses.filter(e => e.status === "pending")
  const filtered = mockExpenses.filter(e => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false
    if (search && !e.vendor.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = [...new Set(mockExpenses.map(e => e.category))]

  return (
    <div>
      <TopNav title="Expenses" breadcrumb="Financial" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Total YTD</div>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalYTD)}</div>
              <div className="text-xs text-slate-400 mt-1">Approved expenses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Pending Approval</div>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingApproval)}</div>
              <div className="text-xs text-slate-400 mt-1">{pendingExpenses.length} items awaiting review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium">Commissions Disclosed</div>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(commissionTotal)}</div>
              <div className="text-xs text-slate-400 mt-1">{commissionCount} referral fees on record</div>
            </CardContent>
          </Card>
        </div>

        {/* Commission alert */}
        {commissionCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>{commissionCount} expenses</strong> contain disclosed referral fees totalling <strong>{formatCurrency(commissionTotal)}</strong>.
              These are recorded in the Commission Disclosure Register as required under the Owners Corporations Act 2006.
            </div>
          </div>
        )}

        {/* Pending approval section */}
        {pendingExpenses.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Committee Approval
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-amber-200">
                  <tr>
                    {["Date", "Vendor", "Description", "Amount", "Fund", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-amber-700 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {pendingExpenses.map(exp => (
                    <tr key={exp.id} className="bg-amber-50/50">
                      <td className="px-4 py-3 text-slate-700">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{exp.description}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={exp.fund === "admin" ? "default" : "success"}>
                          {exp.fund === "admin" ? "Admin" : "Cap. Works"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" className="text-xs bg-green-600 text-white hover:bg-green-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-600 hover:bg-red-50">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters + main table */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search vendor or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Date", "Plan", "Vendor", "Category", "Amount", "Fund", "Status", "Commission", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((exp) => {
                  const plan = mockStrataPlans.find(p => p.id === exp.strataplanId)
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{plan?.name.split(" ")[0]}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                      <td className="px-4 py-3 capitalize text-slate-700 text-xs">{exp.category.replace(/-/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={exp.fund === "admin" ? "default" : "success"} className="text-xs">
                          {exp.fund === "admin" ? "Admin" : "Cap. Works"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {exp.status === "approved"
                          ? <Badge variant="success">Approved</Badge>
                          : <Badge variant="warning">Pending</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        {exp.isCommissionRelated ? (
                          <div>
                            <Badge variant="destructive" className="text-xs">{formatCurrency(exp.commissionAmount!)}</Badge>
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="text-xs">View</Button>
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
