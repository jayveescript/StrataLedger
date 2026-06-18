"use client"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FundBalanceChart } from "@/components/charts/FundBalanceChart"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import {
  Building2, Users, DollarSign, AlertTriangle,
  TrendingUp, CheckCircle2, FileText, Wrench, ClipboardList, MessageSquare, Eye
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

const totalAdminFund = mockStrataPlans.reduce((s, p) => s + p.adminFundBalance, 0)
const totalCapitalFund = mockStrataPlans.reduce((s, p) => s + p.capitalWorksFundBalance, 0)
const totalOutstanding = mockStrataPlans.reduce((s, p) => s + p.outstandingLevies, 0)
const totalLots = mockStrataPlans.reduce((s, p) => s + p.totalLots, 0)

const alerts = [
  {
    type: "red",
    message: "St Kilda Beach Villas capital works fund projected deficit in 2.3 years. Recommended: increase quarterly levy by $38/lot.",
    action: "View Plan",
    href: "/strata-plans/3",
  },
  {
    type: "amber",
    message: "3 levy notices overdue more than 30 days — $3,200 outstanding.",
    action: "View Levies",
    href: "/levies",
  },
  {
    type: "amber",
    message: "Southbank Residences AGM due in 58 days. Notices must go out by 18 July 2026.",
    action: "Prepare AGM",
    href: "/agm",
  },
  {
    type: "blue",
    message: "2 expenses pending committee approval.",
    action: "Review",
    href: "/expenses",
  },
]

const activity = [
  { icon: DollarSign, color: "text-blue-500 bg-blue-50", text: "Levy notice issued — Lot 12, Southbank Residences", time: "2h ago" },
  { icon: CheckCircle2, color: "text-green-500 bg-green-50", text: "Payment received $1,250 — Lot 7, Collins St Apartments", time: "5h ago" },
  { icon: FileText, color: "text-slate-500 bg-slate-50", text: "Expense approved — Cleaning $450, Southbank", time: "Yesterday" },
  { icon: AlertTriangle, color: "text-red-500 bg-red-50", text: "Levy overdue — Lot 3, St Kilda, $600, 32 days", time: "Yesterday" },
  { icon: Wrench, color: "text-orange-500 bg-orange-50", text: "Capital works item added — Roof inspection 2027", time: "2 days ago" },
  { icon: ClipboardList, color: "text-purple-500 bg-purple-50", text: "AGM agenda created — Collins St Apartments", time: "3 days ago" },
  { icon: MessageSquare, color: "text-amber-500 bg-amber-50", text: "New complaint — Lot 14, Southbank, noise", time: "3 days ago" },
  { icon: Eye, color: "text-teal-500 bg-teal-50", text: "Commission disclosed — Cleaning contractor, $200 referral", time: "4 days ago" },
]

function HealthBadge({ status }: { status: string }) {
  if (status === "healthy") return <Badge variant="success">Healthy</Badge>
  if (status === "at-risk") return <Badge variant="warning">At Risk</Badge>
  return <Badge variant="destructive">Critical</Badge>
}

export default function DashboardPage() {
  return (
    <div>
      <TopNav title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-500">Total Plans</div>
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">3</div>
              <div className="text-xs text-slate-400 mt-1">Active strata plans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-500">Total Lots</div>
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{totalLots}</div>
              <div className="text-xs text-slate-400 mt-1">Across all plans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-500">Funds Under Management</div>
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalAdminFund + totalCapitalFund)}</div>
              <div className="text-xs text-slate-400 mt-1">Admin + Capital Works</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-500">Outstanding Levies</div>
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
              <div className="text-xs text-red-400 mt-1">5 notices overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                alert.type === "red"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : alert.type === "amber"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <Link href={alert.href}>
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-xs ml-4 flex-shrink-0 ${
                    alert.type === "red"
                      ? "border-red-300 text-red-700 hover:bg-red-100"
                      : alert.type === "amber"
                      ? "border-amber-300 text-amber-700 hover:bg-amber-100"
                      : "border-blue-300 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {alert.action} →
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Plans table */}
        <Card>
          <CardHeader>
            <CardTitle>Strata Plans</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Plan Name", "Lots", "Admin Fund", "Capital Works", "Outstanding", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockStrataPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{plan.name}</div>
                        <div className="text-xs text-slate-400">{plan.planNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{plan.totalLots}</td>
                      <td className="px-4 py-3 text-blue-700 font-medium">{formatCurrency(plan.adminFundBalance)}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{formatCurrency(plan.capitalWorksFundBalance)}</td>
                      <td className="px-4 py-3">
                        <span className={plan.outstandingLevies > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          {formatCurrency(plan.outstandingLevies)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <HealthBadge status={plan.healthStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/strata-plans/${plan.id}`}>
                          <Button size="sm" variant="outline">View →</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fund Balances — Last 12 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <FundBalanceChart />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {activity.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex gap-3 p-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-700 leading-snug">{item.text}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
