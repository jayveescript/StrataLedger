"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, FileText, CheckCircle2 } from "lucide-react"

const documents = [
  { id: 1, name: "AGM Minutes 2025", type: "PDF", date: "15 Sep 2025", size: "342 KB", category: "AGM", access: "owners" },
  { id: 2, name: "Financial Statements FY2024-25", type: "PDF", date: "12 Aug 2025", size: "1.2 MB", category: "Financial", access: "owners" },
  { id: 3, name: "Building Insurance Certificate 2026", type: "PDF", date: "1 Jun 2026", size: "218 KB", category: "Insurance", access: "owners" },
  { id: 4, name: "Capital Works Plan 2026-2035", type: "PDF", date: "20 Mar 2026", size: "890 KB", category: "Capital Works", access: "owners" },
  { id: 5, name: "OC Rules and Bylaws v3.2", type: "PDF", date: "5 Jan 2024", size: "456 KB", category: "Governance", access: "owners" },
  { id: 6, name: "AGM Notice 2026 (Draft)", type: "PDF", date: "10 Jun 2026", size: "124 KB", category: "AGM", access: "committee" },
  { id: 7, name: "Levy Notice Q3 FY2026 — Lot 7", type: "PDF", date: "15 Mar 2026", size: "78 KB", category: "Levy", access: "personal" },
  { id: 8, name: "Levy Notice Q2 FY2026 — Lot 7", type: "PDF", date: "15 Dec 2025", size: "78 KB", category: "Levy", access: "personal" },
  { id: 9, name: "Levy Notice Q1 FY2026 — Lot 7", type: "PDF", date: "15 Sep 2025", size: "78 KB", category: "Levy", access: "personal" },
  { id: 10, name: "Budget FY2025-26 (Approved)", type: "PDF", date: "20 Aug 2025", size: "245 KB", category: "Financial", access: "owners" },
]

const categoryColors: Record<string, string> = {
  AGM: "bg-blue-100 text-blue-700",
  Financial: "bg-green-100 text-green-700",
  Insurance: "bg-purple-100 text-purple-700",
  "Capital Works": "bg-orange-100 text-orange-700",
  Governance: "bg-slate-100 text-slate-700",
  Levy: "bg-teal-100 text-teal-700",
}

export default function OwnerDocumentsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [toast, setToast] = useState("")

  const categories = ["all", ...new Set(documents.map(d => d.category))]
  const filtered = documents.filter(d => {
    if (category !== "all" && d.category !== category) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDownload = (name: string) => {
    setToast(`Downloading ${name}...`)
    setTimeout(() => setToast(""), 2500)
  }

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Documents</h1>
        <p className="text-slate-500 text-sm">Lot 7 · Southbank Residences</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{doc.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{doc.date} · {doc.size}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[doc.category] ?? "bg-slate-100 text-slate-600"}`}>
                        {doc.category}
                      </span>
                      {doc.access === "personal" && (
                        <Badge variant="default" className="text-xs">My Documents</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(doc.name)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
