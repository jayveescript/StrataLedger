"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { mockLots } from "@/lib/mock-data/lots"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockExpenses } from "@/lib/mock-data/expenses"
import { mockFundTransactions } from "@/lib/mock-data/funds"
import { mockOwners } from "@/lib/mock-data/owners"
import { BudgetVsActualChart } from "@/components/charts/BudgetVsActualChart"
import { FundBalanceChart } from "@/components/charts/FundBalanceChart"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MapPin, Edit, Plus, Download } from "lucide-react"

function LevyStatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>
  if (status === "unpaid") return <Badge variant="warning">Unpaid</Badge>
  return <Badge variant="default">Partial</Badge>
}

function ExpenseStatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>
  return <Badge variant="warning">Pending</Badge>
}

export default function StrataPlanDetail(_props: { params: { id: string } }) {
  const plan = mockStrataPlans[0] // Always show Southbank for static export
  const lots = mockLots.filter(l => l.strataplanId === "1")
  const levies = mockLevies.filter(l => l.strataplanId === "1")
  const expenses = mockExpenses.filter(e => e.strataplanId === "1")
  const transactions = mockFundTransactions.filter(t => t.strataplanId === "1")
  const [fundTab, setFundTab] = useState("admin")

  const totalLeviesIssued = levies.reduce((s, l) => s + l.amount, 0)
  const totalCollected = levies.filter(l => l.status === "paid").reduce((s, l) => s + l.paidAmount, 0)
  const outstanding = totalLeviesIssued - totalCollected

  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return "Vacant"
    const owner = mockOwners.find(o => o.id === ownerId)
    return owner ? `${owner.firstName} ${owner.lastName}` : "Unknown"
  }

  return (
    <div>
      <TopNav title={plan.name} breadcrumb="Strata Plans" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{plan.name}</h2>
              <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{plan.planNumber}</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <MapPin className="w-4 h-4" />
              {plan.address}
            </div>
          </div>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Plan
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lots">Lots</TabsTrigger>
            <TabsTrigger value="levies">Levies</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="funds">Funds</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Admin Fund</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(plan.adminFundBalance)}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">YTD Income</span>
                      <span className="text-green-600 font-medium">+{formatCurrency(48000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">YTD Expenses</span>
                      <span className="text-red-600 font-medium">-{formatCurrency(31200)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Budget</span>
                      <span className="font-medium text-slate-900">{formatCurrency(50000)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Budget used</span>
                      <span>62.4%</span>
                    </div>
                    <Progress value={62} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Capital Works Fund</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(plan.capitalWorksFundBalance)}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">YTD Income</span>
                      <span className="text-green-600 font-medium">+{formatCurrency(24000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">YTD Expenses</span>
                      <span className="text-red-600 font-medium">-{formatCurrency(8500)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Budget</span>
                      <span className="font-medium text-slate-900">{formatCurrency(30000)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Budget used</span>
                      <span>28.3%</span>
                    </div>
                    <Progress value={28} className="[&>div]:bg-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Budget vs Actual</CardTitle></CardHeader>
                <CardContent><BudgetVsActualChart /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Fund Balance Trend</CardTitle></CardHeader>
                <CardContent><FundBalanceChart /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LOTS */}
          <TabsContent value="lots">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Lot No", "Unit", "Floor", "Type", "Entitlement", "Owner", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lots.map((lot) => (
                      <tr key={lot.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{lot.lotNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{lot.unitNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{lot.floor < 0 ? `B${Math.abs(lot.floor)}` : lot.floor}</td>
                        <td className="px-4 py-3 capitalize text-slate-700">{lot.type}</td>
                        <td className="px-4 py-3 text-slate-700">{lot.entitlementUnits} units</td>
                        <td className="px-4 py-3 text-slate-700">{getOwnerName(lot.ownerId)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={lot.status === "occupied" ? "success" : "secondary"}>
                            {lot.status === "occupied" ? "Occupied" : "Vacant"}
                          </Badge>
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
          </TabsContent>

          {/* LEVIES */}
          <TabsContent value="levies" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Total Issued</div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(totalLeviesIssued)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Total Collected</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 mb-1">Outstanding</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(outstanding)}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="font-medium text-slate-900">Levy Notices</div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Issue Q3 Levies
                  </Button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Lot", "Owner", "Amount", "Due Date", "Status", "Paid Date", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {levies.slice(0, 12).map((levy) => {
                      const lot = mockLots.find(l => l.id === levy.lotId)
                      const owner = mockOwners.find(o => o.id === levy.ownerId)
                      return (
                        <tr key={levy.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{lot?.lotNumber}</td>
                          <td className="px-4 py-3 text-slate-700">{owner ? `${owner.firstName} ${owner.lastName}` : "-"}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{formatCurrency(levy.amount)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(levy.dueDate)}</td>
                          <td className="px-4 py-3"><LevyStatusBadge status={levy.status} /></td>
                          <td className="px-4 py-3 text-slate-700">{levy.paidDate ? formatDate(levy.paidDate) : "—"}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="ghost" className="text-xs">
                              {levy.status === "overdue" ? "Reminder" : "View"}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EXPENSES */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="font-medium text-slate-900">Expenses</div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Expense
                  </Button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Date", "Vendor", "Category", "Amount", "Fund", "Status", "Commission", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{formatDate(exp.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                        <td className="px-4 py-3 capitalize text-slate-700">{exp.category.replace(/-/g, " ")}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(exp.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={exp.fund === "admin" ? "default" : "success"}>
                            {exp.fund === "admin" ? "Admin" : "Cap. Works"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3"><ExpenseStatusBadge status={exp.status} /></td>
                        <td className="px-4 py-3">
                          {exp.isCommissionRelated ? (
                            <Badge variant="destructive">{formatCurrency(exp.commissionAmount!)}</Badge>
                          ) : <span className="text-slate-400">—</span>}
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
          </TabsContent>

          {/* FUNDS */}
          <TabsContent value="funds" className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={fundTab === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setFundTab("admin")}
              >
                Admin Fund
              </Button>
              <Button
                variant={fundTab === "capital-works" ? "default" : "outline"}
                size="sm"
                onClick={() => setFundTab("capital-works")}
              >
                Capital Works Fund
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {fundTab === "admin" ? "Admin Fund" : "Capital Works Fund"}
                    </div>
                    <div className="text-sm text-slate-500">Transaction History</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1.5" />
                    Export
                  </Button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Date", "Description", "Debit", "Credit", "Balance"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.filter(t => t.fund === fundTab).map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{formatDate(txn.date)}</td>
                        <td className="px-4 py-3 text-slate-900">{txn.description}</td>
                        <td className="px-4 py-3 text-red-600">{txn.debit > 0 ? formatCurrency(txn.debit) : "—"}</td>
                        <td className="px-4 py-3 text-green-600">{txn.credit > 0 ? formatCurrency(txn.credit) : "—"}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(txn.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[
                    { name: "AGM Minutes 2025.pdf", date: "15 Sep 2025", size: "342 KB" },
                    { name: "Financial Statements FY2024-25.pdf", date: "12 Aug 2025", size: "1.2 MB" },
                    { name: "Insurance Certificate 2026.pdf", date: "1 Jun 2026", size: "218 KB" },
                    { name: "Capital Works Plan 2026-2035.pdf", date: "20 Mar 2026", size: "890 KB" },
                    { name: "OC Rules and Bylaws.pdf", date: "5 Jan 2024", size: "456 KB" },
                  ].map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                          <span className="text-red-500 text-xs font-bold">PDF</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{doc.name}</div>
                          <div className="text-xs text-slate-400">{doc.date} · {doc.size}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
