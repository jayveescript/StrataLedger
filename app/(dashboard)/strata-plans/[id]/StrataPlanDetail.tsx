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
import { MapPin, Edit, Plus, Download, CheckCircle2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
  const [utilToast, setUtilToast] = useState("")
  const [smsTo, setSmsTo] = useState("all")
  const [smsMessage, setSmsMessage] = useState("")
  const [smsSubmitted, setSmsSubmitted] = useState(false)
  const [commsToast, setCommsToast] = useState("")
  const [mailType, setMailType] = useState("levy-notice")
  const [postType, setPostType] = useState("standard")

  const utilityData = [
    { lot: "Lot 1", current: 1247, previous: 1198, usage: 49, amount: 98.00, status: "Billed" },
    { lot: "Lot 2", current: 892, previous: 856, usage: 36, amount: 72.00, status: "Billed" },
    { lot: "Lot 3", current: 1105, previous: 1067, usage: 38, amount: 76.00, status: "Billed" },
    { lot: "Lot 4", current: 743, previous: 714, usage: 29, amount: 58.00, status: "Billed" },
    { lot: "Lot 5", current: 1389, previous: 1334, usage: 55, amount: 110.00, status: "Billed" },
    { lot: "Lot 6", current: 621, previous: 599, usage: 22, amount: 44.00, status: "Pending" },
    { lot: "Lot 7", current: 1512, previous: 1460, usage: 52, amount: 104.00, status: "Pending" },
    { lot: "Lot 8", current: 834, previous: 809, usage: 25, amount: 50.00, status: "Billed" },
    { lot: "Lot 9", current: 967, previous: 934, usage: 33, amount: 66.00, status: "Billed" },
    { lot: "Lot 10", current: 1156, previous: 1118, usage: 38, amount: 76.00, status: "Pending" },
  ]
  const totalUsage = utilityData.reduce((s, u) => s + u.usage, 0)
  const totalUtilBilled = utilityData.reduce((s, u) => s + u.amount, 0)

  const smsHistory = [
    { date: "15 May 2026", to: "All Owners", preview: "AGM reminder — 15 August 2026, 6pm Common Room", recipients: 48, status: "Delivered" },
    { date: "3 May 2026", to: "All Owners", preview: "Water shut off tomorrow 9am-12pm for maintenance", recipients: 48, status: "Delivered" },
    { date: "1 Apr 2026", to: "Overdue Owners", preview: "Overdue levy reminder Q2 FY2026 — please pay by 15 Apr", recipients: 3, status: "Delivered" },
    { date: "15 Mar 2026", to: "All Owners", preview: "Building insurance renewed — documents available in your portal", recipients: 48, status: "Delivered" },
    { date: "1 Feb 2026", to: "Committee Only", preview: "Upcoming committee meeting — 15 Feb 2026 at 7pm", recipients: 5, status: "Delivered" },
  ]

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
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
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
            {/* Bank Integration */}
            <Card className="border-blue-200 mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Connected Bank Accounts</CardTitle>
                  <Badge variant="success">2 Connected</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Admin Fund", acc: "****4521" },
                  { name: "Capital Works Fund", acc: "****7834" },
                ].map(acct => (
                  <div key={acct.name} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🏦</div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">Macquarie Bank — {acct.name}</div>
                        <div className="text-xs text-slate-500">BSB: 182-512 · Acc: {acct.acc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">✅ Connected</div>
                      <div className="text-xs text-slate-400">Last synced: Today 9:14am</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-1">
                  <Button variant="outline" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Connect Bank Account
                  </Button>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Supported:</span>
                    {["Macquarie", "NAB", "Westpac"].map(b => (
                      <span key={b} className="px-2 py-0.5 bg-slate-100 rounded font-medium text-slate-600">{b}</span>
                    ))}
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-400">+ More</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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

          {/* UTILITIES */}
          <TabsContent value="utilities" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4">
                <div className="text-xs text-slate-500 mb-1">Total Usage</div>
                <div className="text-xl font-bold text-slate-900">{totalUsage} kL</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="text-xs text-slate-500 mb-1">Total Billed</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(totalUtilBilled)}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="text-xs text-slate-500 mb-1">Rate</div>
                <div className="text-xl font-bold text-slate-900">$2.00/kL</div>
              </CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="font-medium text-slate-900">Water Usage — June 2026</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setUtilToast("Excel import coming soon"); setTimeout(() => setUtilToast(""), 3000) }}>
                      Import from Excel
                    </Button>
                    <Button size="sm" onClick={() => { setUtilToast("Utility invoices generating..."); setTimeout(() => setUtilToast(""), 3000) }}>
                      Generate Invoices
                    </Button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Unit", "Current (kL)", "Previous (kL)", "Usage (kL)", "Amount", "Status"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {utilityData.map(u => (
                      <tr key={u.lot} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.lot}</td>
                        <td className="px-4 py-3 text-slate-700">{u.current.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-700">{u.previous.toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{u.usage}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(u.amount)}</td>
                        <td className="px-4 py-3"><Badge variant={u.status === "Billed" ? "success" : "warning"}>{u.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            {utilToast && (
              <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />{utilToast}
              </div>
            )}
          </TabsContent>

          {/* COMMUNICATIONS */}
          <TabsContent value="communications" className="space-y-6">
            {/* SMS Card */}
            <Card>
              <CardHeader><CardTitle className="text-base">📱 SMS Broadcast</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {smsSubmitted ? (
                  <div className="flex flex-col items-center py-6 gap-3 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                    <div>
                      <div className="font-semibold text-slate-900">SMS Queued Successfully</div>
                      <div className="text-sm text-slate-500 mt-1">Your message has been queued for delivery to {smsTo === "all" ? "48 owners" : smsTo === "committee" ? "5 committee members" : "3 overdue owners"}.</div>
                    </div>
                    <Button onClick={() => { setSmsSubmitted(false); setSmsMessage("") }}>Send Another</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Send To</Label>
                        <Select value={smsTo} onValueChange={setSmsTo}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Owners (48)</SelectItem>
                            <SelectItem value="committee">Committee Only (5)</SelectItem>
                            <SelectItem value="overdue">Overdue Owners (3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <span className={`text-xs ${smsMessage.length > 160 ? "text-red-500" : "text-slate-400"}`}>{smsMessage.length}/160</span>
                      </div>
                      <Textarea value={smsMessage} onChange={e => { if (e.target.value.length <= 160) setSmsMessage(e.target.value) }} placeholder="Type your SMS message..." rows={3} />
                    </div>
                    <Button onClick={() => setSmsSubmitted(true)} disabled={!smsMessage.trim()}>Send SMS</Button>
                  </div>
                )}
                {/* SMS History */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="font-medium text-slate-900 text-sm mb-3">SMS History</div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>{["Date", "Sent To", "Message Preview", "Rcpt", "Status"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {smsHistory.map((msg, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600">{msg.date}</td>
                            <td className="px-3 py-2 text-slate-600">{msg.to}</td>
                            <td className="px-3 py-2 text-slate-900 max-w-[200px]"><div className="truncate">{msg.preview}</div></td>
                            <td className="px-3 py-2 text-slate-600">{msg.recipients}</td>
                            <td className="px-3 py-2"><Badge variant="success" className="text-xs">{msg.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Postal Mail Card */}
            <Card>
              <CardHeader><CardTitle className="text-base">✉️ Bing Mail House</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Letter Type</Label>
                    <Select value={mailType} onValueChange={setMailType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="levy-notice">Levy Notice</SelectItem>
                        <SelectItem value="agm-notice">AGM Notice</SelectItem>
                        <SelectItem value="overdue-notice">Overdue Notice</SelectItem>
                        <SelectItem value="custom">Custom Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Post Type</Label>
                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard post</SelectItem>
                        <SelectItem value="priority">Priority post</SelectItem>
                        <SelectItem value="registered">Registered post (tracked)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Cost estimate: </span>
                  Standard post × 48 recipients = Est. <strong>$67.20 inc GST</strong>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setCommsToast("Letter preview generated"); setTimeout(() => setCommsToast(""), 3000) }}>Preview Letter</Button>
                  <Button onClick={() => { setCommsToast("Queued for printing and dispatch via Bing Mail House"); setTimeout(() => setCommsToast(""), 3000) }}>Send to Mail House</Button>
                </div>
              </CardContent>
            </Card>

            {commsToast && (
              <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />{commsToast}
              </div>
            )}
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
