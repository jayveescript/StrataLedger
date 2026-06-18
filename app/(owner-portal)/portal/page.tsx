"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockExpenses } from "@/lib/mock-data/expenses"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

const recentExpenses = mockExpenses.filter(e => e.strataplanId === "1" && e.status === "approved").slice(0, 5)

const ENTITLEMENT_SHARE = 0.0208 // 15/720

export default function OwnerPortalPage() {
  const adminBalance = 24500
  const capitalBalance = 187000

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl p-6">
        <div className="text-sm text-blue-200 mb-1">Owner Portal</div>
        <h1 className="text-2xl font-bold mb-1">Welcome, James. Here&apos;s everything about your strata — no secrets.</h1>
        <p className="text-blue-200 text-sm">Southbank Residences · Lot 7, Unit 714, Level 7</p>
      </div>

      {/* Capital works alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Capital works fund alert:</strong> Your building&apos;s capital works fund is projected to run short in 2.3 years. The committee is reviewing levy increases. <Link href="/portal/funds" className="underline font-semibold">See 10-year forecast →</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My lot card */}
        <Card>
          <CardHeader><CardTitle>My Lot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-slate-900">Lot 7</div>
            <div className="text-slate-500 text-sm">Unit 714 · Level 7</div>
            <div className="text-slate-700 text-sm">Southbank Residences</div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Entitlement</span>
                <span className="font-medium">15 of 720 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Share</span>
                <span className="font-medium">2.08%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium">Apartment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Levy status */}
        <Card>
          <CardHeader><CardTitle>My Levies</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800 text-sm">Q3 FY2026 — PAID</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(1250)}</div>
              <div className="text-xs text-green-600 mt-1">Paid 30 Mar 2026 · Due 1 Apr 2026</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800 text-sm">Q4 FY2026 — UPCOMING</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(1250)}</div>
              <div className="text-xs text-blue-600 mt-1">Due 1 Jul 2026 · Admin $850 + Capital $400</div>
            </div>
            <Link href="/portal/levies">
              <Button variant="outline" className="w-full text-sm">View levy history →</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Fund cards */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-700">Admin Fund (your share)</div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(adminBalance * ENTITLEMENT_SHARE)}</div>
              <div className="text-xs text-slate-500 mt-1">Total fund: {formatCurrency(adminBalance)} · Your 2.08%</div>
              <div className="text-xs text-slate-400 mt-1">Day-to-day expenses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-700">Capital Works (your share)</div>
                <Badge variant="warning">At Risk</Badge>
              </div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(capitalBalance * ENTITLEMENT_SHARE)}</div>
              <div className="text-xs text-slate-500 mt-1">Total fund: {formatCurrency(capitalBalance)} · Your 2.08%</div>
              <Link href="/portal/funds" className="text-xs text-blue-600 mt-1 block hover:underline">See 10-year forecast →</Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses — Where your levy goes</CardTitle>
            <Link href="/portal/funds">
              <Button variant="outline" size="sm">View all →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Date", "Description", "Category", "Amount"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3 text-slate-900">{exp.vendor}</td>
                  <td className="px-4 py-3 capitalize text-slate-500 text-xs">{exp.category.replace(/-/g, " ")}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
