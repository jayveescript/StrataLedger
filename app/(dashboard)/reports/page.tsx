"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import {
  BarChart3, FileText, AlertTriangle, ClipboardList,
  Wrench, Briefcase, Search, BarChart2, Download, CheckCircle2
} from "lucide-react"

const reportTypes = [
  { id: "fund-balance", icon: BarChart3, title: "Fund Balance Summary", description: "Current balances vs budget for all plans", color: "bg-blue-50 text-blue-600" },
  { id: "income-expenditure", icon: BarChart2, title: "Income & Expenditure", description: "YTD income and expenses by category", color: "bg-green-50 text-green-600" },
  { id: "levy-arrears", icon: AlertTriangle, title: "Levy Arrears Report", description: "Outstanding levies, days overdue, totals", color: "bg-red-50 text-red-600" },
  { id: "annual-financial", icon: FileText, title: "Annual Financial Statement", description: "AGM-ready full year financial report", color: "bg-purple-50 text-purple-600" },
  { id: "capital-works", icon: Wrench, title: "10-Year Capital Works Forecast", description: "Projected expenditure vs fund balance", color: "bg-orange-50 text-orange-600" },
  { id: "commission", icon: Briefcase, title: "Commission Disclosure Report", description: "All referral fees disclosed in period", color: "bg-amber-50 text-amber-600" },
  { id: "audit-trail", icon: Search, title: "Audit Trail Report", description: "Every action on financial records", color: "bg-slate-100 text-slate-600" },
  { id: "budget-vs-actual", icon: ClipboardList, title: "Budget vs Actual", description: "Variance analysis per category", color: "bg-teal-50 text-teal-600" },
]

const previewData: Record<string, { title: string; rows: string[][] }> = {
  "fund-balance": {
    title: "Fund Balance Summary — All Plans — Jun 2026",
    rows: [
      ["Plan", "Admin Fund", "Budget", "Variance", "Cap. Works", "CW Budget"],
      ["Southbank Residences", "$24,500.00", "$50,000.00", "-$25,500.00", "$187,000.00", "$30,000.00"],
      ["Collins St Apartments", "$8,750.00", "$18,000.00", "-$9,250.00", "$45,000.00", "$9,600.00"],
      ["St Kilda Beach Villas", "$3,200.00", "$8,400.00", "-$5,200.00", "$12,000.00", "$4,800.00"],
      ["TOTAL", "$36,450.00", "$76,400.00", "-$39,950.00", "$244,000.00", "$44,400.00"],
    ],
  },
  "levy-arrears": {
    title: "Levy Arrears Report — As at 17 Jun 2026",
    rows: [
      ["Lot", "Owner", "Amount", "Due Date", "Days Overdue", "Status"],
      ["Lot 12", "Michael O'Brien", "$2,500.00", "1 Apr 2026", "77", "Overdue"],
      ["Lot 9", "Aisha Rahman", "$2,000.00", "1 Apr 2026", "77", "Overdue"],
      ["Lot 1 (SK)", "John Papadopoulos", "$600.00", "1 Apr 2026", "77", "Overdue"],
      ["Lot 2 (SK)", "John Papadopoulos", "$600.00", "1 Apr 2026", "77", "Overdue"],
      ["TOTAL OVERDUE", "", "$5,700.00", "", "", ""],
    ],
  },
  "commission": {
    title: "Commission Disclosure Register — FY2025-26",
    rows: [
      ["Date", "Contractor", "Service", "Invoice", "Commission", "Disclosed By"],
      ["5 Jun 2026", "CleanPro Services", "Cleaning", "$2,200.00", "$200.00", "Sarah Johnson"],
      ["28 May 2026", "Green Thumb Landscaping", "Gardening", "$950.00", "$100.00", "Sarah Johnson"],
      ["10 Apr 2026", "Pool Tech VIC", "Pool Works", "$2,800.00", "$280.00", "Sarah Johnson"],
      ["TOTAL", "", "", "", "$580.00", ""],
    ],
  },
  "income-expenditure": {
    title: "Income & Expenditure — Southbank Residences — FY2025-26",
    rows: [
      ["Category", "Budget", "Actual YTD", "Variance", "% Used"],
      ["Levy Income", "$50,000.00", "$48,000.00", "-$2,000.00", "96.0%"],
      ["Cleaning", "$12,000.00", "$9,850.00", "+$2,150.00", "82.1%"],
      ["Insurance", "$28,500.00", "$28,500.00", "$0.00", "100.0%"],
      ["Management Fee", "$42,000.00", "$38,500.00", "+$3,500.00", "91.7%"],
      ["Maintenance", "$15,000.00", "$18,200.00", "-$3,200.00", "121.3%"],
      ["NET SURPLUS", "", "$9,450.00", "", ""],
    ],
  },
  "capital-works": {
    title: "10-Year Capital Works Forecast — Southbank Residences",
    rows: [
      ["Year", "Opening Balance", "Contributions", "Expenditure", "Closing Balance"],
      ["2026", "$187,000.00", "$10,000.00", "$35,000.00", "$162,000.00"],
      ["2027", "$162,000.00", "$10,000.00", "$15,000.00", "$157,000.00"],
      ["2028", "$157,000.00", "$10,000.00", "$67,000.00", "$100,000.00"],
      ["2029", "$100,000.00", "$10,000.00", "$120,000.00", "-$10,000.00 ⚠️"],
      ["2030", "-$10,000.00", "$10,000.00", "$28,000.00", "-$28,000.00"],
    ],
  },
  "annual-financial": {
    title: "Annual Financial Statement — Southbank Residences — FY2025-26",
    rows: [
      ["Item", "Amount"],
      ["Opening Admin Fund Balance", "$18,200.00"],
      ["Total Levy Income", "$48,000.00"],
      ["Total Expenditure", "-$41,700.00"],
      ["Closing Admin Fund Balance", "$24,500.00"],
      ["Opening Capital Works Balance", "$162,000.00"],
      ["Capital Works Levy Income", "$24,000.00"],
      ["Capital Works Expenditure", "-$8,500.00"],
      ["Closing Capital Works Balance", "$187,000.00 ✓"],
    ],
  },
  "audit-trail": {
    title: "Audit Trail — Southbank Residences — Jun 2026",
    rows: [
      ["Timestamp", "User", "Action", "Record", "Details"],
      ["17 Jun 2026 09:12", "Sarah Johnson", "Viewed", "Fund Balance", "All plans summary"],
      ["15 Jun 2026 14:33", "Sarah Johnson", "Approved", "Expense EXP-001", "CleanPro $2,200"],
      ["12 Jun 2026 11:02", "James Chen", "Submitted", "Complaint CMP-002", "Commission query"],
      ["10 Jun 2026 16:45", "Sarah Johnson", "Issued", "Levy LEV-2026-003", "Q4 notice Lot 7"],
      ["8 Jun 2026 10:20", "Sarah Johnson", "Added", "Expense EXP-009", "Apex Plumbing pending"],
    ],
  },
  "budget-vs-actual": {
    title: "Budget vs Actual — All Plans — FY2025-26",
    rows: [
      ["Category", "Budget", "Actual", "Variance $", "Variance %"],
      ["Cleaning", "$18,000.00", "$15,450.00", "+$2,550.00", "+14.2%"],
      ["Insurance", "$52,500.00", "$52,500.00", "$0.00", "0.0%"],
      ["Gardening", "$8,000.00", "$6,530.00", "+$1,470.00", "+18.4%"],
      ["Management Fees", "$71,000.00", "$69,400.00", "+$1,600.00", "+2.3%"],
      ["Maintenance", "$22,000.00", "$26,450.00", "-$4,450.00", "-20.2%"],
      ["TOTAL", "$171,500.00", "$170,330.00", "+$1,170.00", "+0.7%"],
    ],
  },
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("fund-balance")
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [toast, setToast] = useState("")

  const preview = previewData[selectedReport] ?? previewData["fund-balance"]

  const handleDownload = (format: string) => {
    setToast(`${format} downloading...`)
    setTimeout(() => setToast(""), 3000)
  }

  return (
    <div>
      <TopNav title="Reports" breadcrumb="Financial" />
      <div className="p-6 space-y-6">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </div>
        )}

        <div className="flex gap-3">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {mockStrataPlans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="2025-26">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-26">FY 2025–26</SelectItem>
              <SelectItem value="2024-25">FY 2024–25</SelectItem>
              <SelectItem value="2023-24">FY 2023–24</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {reportTypes.map((report) => {
              const Icon = report.icon
              const isSelected = selectedReport === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${report.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-medium text-sm ${isSelected ? "text-blue-900" : "text-slate-900"}`}>{report.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{report.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{preview.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Generated: 17 Jun 2026 · StrataLedger</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleDownload("PDF")}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload("CSV")}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        {preview.rows[0].map((h, i) => (
                          <th key={i} className="text-left px-3 py-2.5 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.rows.slice(1).map((row, ri) => (
                        <tr key={ri} className={ri === preview.rows.length - 2 ? "bg-slate-50 font-semibold" : "hover:bg-slate-50"}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2.5 text-slate-700">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                  Generated by StrataLedger for compliance purposes under the Owners Corporations Act 2006 (Vic). All figures subject to audit.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
