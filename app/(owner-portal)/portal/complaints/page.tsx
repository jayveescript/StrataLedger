"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { mockComplaints } from "@/lib/mock-data/complaints"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react"

const myComplaints = mockComplaints.filter(c => c.ownerId === "o1")

type NewComplaint = { category: string; title: string; description: string }

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open": return <Badge variant="warning">Open</Badge>
    case "in-progress": return <Badge variant="default">In Progress</Badge>
    case "resolved": return <Badge variant="success">Resolved</Badge>
    case "escalated": return <Badge variant="destructive">Escalated</Badge>
    default: return null
  }
}

function Timeline({ complaint }: { complaint: typeof myComplaints[0] }) {
  const steps = [
    { label: "Submitted", date: complaint.submittedDate, done: true },
    { label: "Manager notified", date: complaint.submittedDate, done: true },
    { label: "Response due (SLA 14 days)", date: complaint.dueDate, done: !!complaint.responseDate },
    { label: "Resolved", date: complaint.responseDate ?? null, done: complaint.status === "resolved" },
  ]
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${step.done ? "bg-green-500" : "bg-slate-300"}`}></div>
          <div className="text-sm">
            <span className={step.done ? "text-slate-900 font-medium" : "text-slate-400"}>{step.label}</span>
            {step.date && step.done && (
              <span className="text-slate-400 text-xs ml-2">({formatDate(step.date)})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OwnerComplaintsPage() {
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<NewComplaint>({ category: "", title: "", description: "" })
  const [localComplaints, setLocalComplaints] = useState(myComplaints)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newComplaint = {
      id: `cmp-new-${Date.now()}`,
      strataplanId: "1",
      lotId: "l1-7",
      ownerId: "o1",
      category: form.category,
      title: form.title,
      description: form.description,
      submittedDate: "2026-06-17",
      status: "open",
      priority: "medium",
      managerResponse: null,
      responseDate: null,
      dueDate: "2026-07-01",
      isOverdue: false,
    } as typeof myComplaints[0]
    setLocalComplaints([newComplaint, ...localComplaints])
    setSubmitted(true)
    setShowForm(false)
    setForm({ category: "", title: "", description: "" })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Complaints</h1>
          <p className="text-slate-500 text-sm">Lot 7 · Southbank Residences</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Complaint
        </Button>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <div className="font-semibold">Complaint submitted successfully.</div>
            <div>Your strata manager has been notified and must respond within 14 days under the Owners Corporations Act 2006.</div>
          </div>
        </div>
      )}

      {/* New complaint form */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Submit New Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="noise">Noise</SelectItem>
                    <SelectItem value="bylaw">Bylaw Breach</SelectItem>
                    <SelectItem value="manager-conduct">Manager Conduct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="Brief summary of your complaint"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the issue in detail. Include dates, locations, and any relevant context..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="min-h-[120px]"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Submit Complaint</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
              <div className="text-xs text-slate-400">
                Your manager is required to respond within 14 days under the Owners Corporations Act 2006 (Vic). You may escalate to Consumer Affairs Victoria if no response is received.
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Complaint list */}
      <div className="space-y-4">
        {localComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <div className="font-medium">No complaints on record</div>
              <div className="text-sm mt-1">Use the button above to submit a complaint</div>
            </CardContent>
          </Card>
        ) : (
          localComplaints.map(c => (
            <Card key={c.id} className={c.isOverdue ? "border-red-200 bg-red-50/20" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <StatusBadge status={c.status} />
                      <span className="capitalize text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.category}</span>
                      {c.isOverdue && <Badge variant="destructive">SLA Breached</Badge>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">Ref: {c.id.toUpperCase()} · Submitted {formatDate(c.submittedDate)}</div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    SLA due {formatDate(c.dueDate)}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Your complaint</div>
                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{c.description}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Progress</div>
                    <Timeline complaint={c} />
                    {c.managerResponse && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Manager response</div>
                        <div className="text-sm text-slate-700 leading-relaxed bg-green-50 border border-green-200 rounded-lg p-3">{c.managerResponse}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
