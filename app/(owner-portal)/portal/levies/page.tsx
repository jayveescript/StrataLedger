"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockLevies } from "@/lib/mock-data/levies"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Download, CheckCircle2 } from "lucide-react"

const myLevies = mockLevies
  .filter(l => l.ownerId === "o1")
  .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

function LevyBadge({ status }: { status: string }) {
  switch (status) {
    case "paid": return <Badge variant="success">Paid</Badge>
    case "overdue": return <Badge variant="destructive">Overdue</Badge>
    case "unpaid": return <Badge variant="warning">Unpaid</Badge>
    case "partial": return <Badge variant="default">Partial</Badge>
    default: return null
  }
}

export default function OwnerLeviesPage() {
  const [toast, setToast] = useState("")

  const handleReceipt = () => {
    setToast("Receipt downloading...")
    setTimeout(() => setToast(""), 2500)
  }

  const totalPaid = myLevies.filter(l => l.status === "paid").reduce((s, l) => s + l.paidAmount, 0)
  const adminTotal = myLevies.filter(l => l.fund === "admin" && l.status === "paid").reduce((s, l) => s + l.paidAmount, 0)
  const capitalTotal = myLevies.filter(l => l.fund === "capital-works" && l.status === "paid").reduce((s, l) => s + l.paidAmount, 0)

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Levies</h1>
        <p className="text-slate-500 text-sm">Lot 7 · Southbank Residences</p>
      </div>

      {/* Payment breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-slate-500 mb-1">Total Paid (YTD)</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-slate-500 mb-1">Admin Fund Paid</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(adminTotal)}</div>
            <div className="text-xs text-slate-400 mt-1">68% of total levy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-slate-500 mb-1">Capital Works Paid</div>
            <div className="text-2xl font-bold text-teal-600">{formatCurrency(capitalTotal)}</div>
            <div className="text-xs text-slate-400 mt-1">32% of total levy</div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Levy Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <div className="text-sm font-semibold text-slate-700 mb-3">Standard quarterly levy: {formatCurrency(1250)}</div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-700">Admin Fund contribution</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">{formatCurrency(850)}</span>
                <span className="text-slate-400 text-xs ml-1">68%</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "68%" }}></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-slate-700">Capital Works Fund contribution</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">{formatCurrency(400)}</span>
                <span className="text-slate-400 text-xs ml-1">32%</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full" style={{ width: "32%" }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Levy history */}
      <Card>
        <CardHeader>
          <CardTitle>Levy History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Quarter", "Reference", "Fund", "Amount", "Due Date", "Paid Date", "Status", "Receipt"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myLevies.map((levy) => (
                <tr key={levy.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{levy.quarter}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{levy.reference}</td>
                  <td className="px-4 py-3">
                    <Badge variant={levy.fund === "admin" ? "default" : "success"} className="text-xs">
                      {levy.fund === "admin" ? "Admin" : "Cap. Works"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(levy.amount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(levy.dueDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{levy.paidDate ? formatDate(levy.paidDate) : "—"}</td>
                  <td className="px-4 py-3"><LevyBadge status={levy.status} /></td>
                  <td className="px-4 py-3">
                    {levy.status === "paid" ? (
                      <Button size="sm" variant="ghost" className="text-xs text-blue-600" onClick={handleReceipt}>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Receipt
                      </Button>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
