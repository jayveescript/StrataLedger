"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockFundTransactions } from "@/lib/mock-data/funds"
import { mockExpenses } from "@/lib/mock-data/expenses"
import { ExpensePieChart } from "@/components/charts/ExpensePieChart"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const SHARE = 0.0208

const adminTxns = mockFundTransactions.filter(t => t.strataplanId === "1" && t.fund === "admin")
const commissions = mockExpenses.filter(e => e.strataplanId === "1" && e.isCommissionRelated)

const upcomingWorks = [
  { year: 2027, item: "Roof inspection and repair", cost: 15000 },
  { year: 2028, item: "External painting — full building", cost: 45000 },
  { year: 2029, item: "Lift modernisation (2 lifts)", cost: 120000 },
]

export default function OwnerFundsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Fund Balances</h1>
        <p className="text-slate-500 text-sm">Lot 7 · Southbank Residences · Your 2.08% entitlement share</p>
      </div>

      {/* Admin Fund */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          Admin Fund
          <Badge variant="success">Healthy</Badge>
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Current Balance", value: formatCurrency(24500), sub: `Your share: ${formatCurrency(24500 * SHARE)}` },
            { label: "Annual Budget", value: formatCurrency(50000), sub: "FY 2025–26" },
            { label: "YTD Spent", value: formatCurrency(31200), sub: "62.4% of budget" },
            { label: "Budget Remaining", value: formatCurrency(18800), sub: "37.6% remaining" },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="text-xs text-slate-400 mb-1">{c.label}</div>
                <div className="text-xl font-bold text-slate-900">{c.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
            <CardContent><ExpensePieChart /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Date", "Description", "Debit", "Credit", "Balance"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminTxns.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(txn.date)}</td>
                      <td className="px-4 py-2.5 text-slate-900 text-xs max-w-[160px] truncate">{txn.description}</td>
                      <td className="px-4 py-2.5 text-red-600 text-xs">{txn.debit > 0 ? formatCurrency(txn.debit) : "—"}</td>
                      <td className="px-4 py-2.5 text-green-600 text-xs">{txn.credit > 0 ? formatCurrency(txn.credit) : "—"}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 text-xs">{formatCurrency(txn.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Capital Works Fund */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          Capital Works Fund
          <Badge variant="warning">At Risk</Badge>
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Current Balance", value: formatCurrency(187000), sub: `Your share: ${formatCurrency(187000 * SHARE)}` },
            { label: "10-Year Plan Total", value: formatCurrency(380000), sub: "Planned 2026–2035" },
            { label: "Projected Shortfall", value: formatCurrency(193000), color: "text-red-600", sub: "Without levy increase" },
            { label: "Status", value: "⚠️ At Risk", color: "text-amber-600", sub: "Deficit projected 2029" },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="text-xs text-slate-400 mb-1">{c.label}</div>
                <div className={`text-xl font-bold ${"color" in c ? c.color : "text-slate-900"}`}>{c.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <div className="font-semibold mb-1">Capital works fund at risk</div>
            Based on planned maintenance, the fund is projected to run out in 2029 without a levy increase. The OC committee is reviewing a proposal to increase quarterly contributions by $38.50/lot.
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Upcoming Major Works</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingWorks.map(w => (
                <div key={w.year} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">{w.year}</div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{w.item}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">{formatCurrency(w.cost)}</div>
                </div>
              ))}
              <div className="text-xs text-slate-400 pt-2">
                <Link href="/capital-works" className="text-blue-600 hover:underline">View full 10-year forecast in manager portal →</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission disclosure */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Commission Disclosure Register</h2>
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            All referral fees paid to your strata manager are legally required to be disclosed under the Owners Corporations Act 2006 (Vic). The following fees have been recorded.
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Date", "Contractor", "Service", "Fee Disclosed", "Disclosed By"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 text-sm">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                    <td className="px-4 py-3 capitalize text-slate-700 text-sm">{exp.category}</td>
                    <td className="px-4 py-3 font-semibold text-orange-600">{formatCurrency(exp.commissionAmount!)}</td>
                    <td className="px-4 py-3 text-slate-700">{exp.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
