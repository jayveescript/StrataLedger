"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { mockComplaints } from "@/lib/mock-data/complaints"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockLots } from "@/lib/mock-data/lots"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { formatDate } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, ExternalLink, FileText } from "lucide-react"

type Complaint = typeof mockComplaints[0]

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open": return <Badge variant="warning">Open</Badge>
    case "in-progress": return <Badge variant="default">In Progress</Badge>
    case "resolved": return <Badge variant="success">Resolved</Badge>
    case "escalated": return <Badge variant="destructive">Escalated</Badge>
    default: return null
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") return <Badge variant="destructive">High</Badge>
  if (priority === "medium") return <Badge variant="warning">Medium</Badge>
  return <Badge variant="success">Low</Badge>
}

function SLAStatus({ complaint }: { complaint: Complaint }) {
  if (complaint.isOverdue) {
    return <span className="text-red-600 text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />SLA Breached</span>
  }
  const due = new Date(complaint.dueDate)
  const now = new Date("2026-06-17")
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 3) return <span className="text-amber-600 text-xs font-medium">{days}d left</span>
  return <span className="text-green-600 text-xs font-medium">{days}d left</span>
}

export default function ComplaintsPage() {
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [response, setResponse] = useState("")
  const [savedResponse, setSavedResponse] = useState(false)
  const [vcatOpen, setVcatOpen] = useState(false)
  const [vcatGenerating, setVcatGenerating] = useState(false)

  const open = mockComplaints.filter(c => c.status === "open").length
  const inProgress = mockComplaints.filter(c => c.status === "in-progress").length
  const resolved = mockComplaints.filter(c => c.status === "resolved").length
  const overdue = mockComplaints.filter(c => c.isOverdue).length

  return (
    <div>
      <TopNav title="Complaints" breadcrumb="Governance" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
            ⭐ Complaint module not available in IntelliStrata
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Open", value: open, color: "text-amber-600" },
            { label: "In Progress", value: inProgress, color: "text-blue-600" },
            { label: "Resolved", value: resolved, color: "text-green-600" },
            { label: "SLA Breached", value: overdue, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {overdue > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800 font-medium">
              {overdue} complaint{overdue > 1 ? "s have" : " has"} breached the 14-day response SLA. Action required immediately.
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Ref", "Plan", "Lot", "Category", "Title", "Submitted", "Status", "SLA", "Priority", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockComplaints.map((c) => {
                  const plan = mockStrataPlans.find(p => p.id === c.strataplanId)
                  const lot = mockLots.find(l => l.id === c.lotId)
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 cursor-pointer ${c.isOverdue ? "bg-red-50/30" : ""}`}
                      onClick={() => { setSelected(c); setResponse(""); setSavedResponse(false) }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.id.toUpperCase()}</td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{plan?.name.split(" ")[0]}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{lot?.lotNumber}</td>
                      <td className="px-4 py-3 capitalize text-slate-700 text-xs">{c.category}</td>
                      <td className="px-4 py-3 text-slate-900 max-w-xs">
                        <div className="truncate font-medium">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{formatDate(c.submittedDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><SLAStatus complaint={c} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={e => { e.stopPropagation(); setSelected(c); setResponse(""); setSavedResponse(false) }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={selected.status} />
                    <PriorityBadge priority={selected.priority} />
                    {selected.isOverdue && <Badge variant="destructive">SLA Breached</Badge>}
                  </div>
                  <DialogTitle>{selected.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Category</div>
                      <div className="capitalize font-medium text-slate-900">{selected.category}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Submitted</div>
                      <div className="font-medium text-slate-900">{formatDate(selected.submittedDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">SLA Due</div>
                      <div className="font-medium text-slate-900">{formatDate(selected.dueDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Lot</div>
                      <div className="font-medium text-slate-900">
                        {mockLots.find(l => l.id === selected.lotId)?.lotNumber} —{" "}
                        {(() => { const o = mockOwners.find(o => o.id === selected.ownerId); return o ? `${o.firstName} ${o.lastName}` : "" })()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Description</div>
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{selected.description}</div>
                  </div>

                  {selected.managerResponse && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Manager Response — {formatDate(selected.responseDate!)}</div>
                      <div className="text-sm text-slate-700 leading-relaxed bg-green-50 border border-green-200 rounded-lg p-4">{selected.managerResponse}</div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-700 uppercase tracking-wide">Update Response</div>
                    <Select defaultValue={selected.status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Write your response to the lot owner..."
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                      className="min-h-[100px]"
                    />
                    {savedResponse && (
                      <div className="text-xs text-green-600 font-medium">✓ Response saved successfully</div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => setSavedResponse(true)}>Save Response</Button>
                      <Button variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Escalate to Consumer Affairs
                      </Button>
                      <Button
                        variant="outline"
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => setVcatOpen(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate VCAT Package
                      </Button>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Internal Note (not visible to owner)</div>
                      <Textarea
                        placeholder="Add an internal note visible only to strata managers..."
                        className="min-h-[70px] bg-amber-50 border-amber-200 text-xs"
                      />
                      <Button size="sm" variant="outline" className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50">
                        Save Internal Note
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={vcatOpen} onOpenChange={(open) => { if (!open) { setVcatOpen(false); setVcatGenerating(false) } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate VCAT Package</DialogTitle>
              <DialogDescription>Compile all relevant records into a submission-ready package for VCAT (Victorian Civil and Administrative Tribunal).</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="text-sm font-medium text-slate-700">What&apos;s included:</div>
              <div className="space-y-2">
                {["Complaint history + timeline", "Manager responses", "Financial statements (relevant period)", "Commission disclosure register", "Audit trail of relevant transactions", "Levy history for complainant", "Correspondence log"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              {vcatGenerating ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  VCAT package generating... This may take a moment.
                </div>
              ) : (
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setVcatOpen(false)}>Cancel</Button>
                  <Button onClick={() => { setVcatGenerating(true); setTimeout(() => setVcatOpen(false), 2500) }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate VCAT Package PDF
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
