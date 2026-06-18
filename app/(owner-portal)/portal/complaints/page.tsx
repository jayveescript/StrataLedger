"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { mockComplaints } from "@/lib/mock-data/complaints"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, Plus, AlertTriangle, Clock } from "lucide-react"

const myComplaints = mockComplaints.filter(c => c.ownerId === "o1")

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

function Timeline({ complaint }: { complaint: Complaint }) {
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

const CATEGORIES = [
  "Financial discrepancy",
  "Maintenance neglected",
  "Governance breach",
  "Manager conduct",
  "Commission not disclosed",
  "By-law breach",
  "Noise / nuisance",
  "Other",
]

const DESIRED_OUTCOMES = [
  "Formal apology",
  "Financial remedy",
  "Action to be taken",
  "Escalation to Consumer Affairs Victoria",
  "Other (specify)",
]

export default function OwnerComplaintsPage() {
  const [localComplaints, setLocalComplaints] = useState<Complaint[]>(myComplaints)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [category, setCategory] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [raisedInformally, setRaisedInformally] = useState("")
  const [desiredOutcome, setDesiredOutcome] = useState("")
  const [desiredOutcomeOther, setDesiredOutcomeOther] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function resetDialog() {
    setStep(1)
    setSubmitted(false)
    setCategory("")
    setTitle("")
    setDescription("")
    setIncidentDate("")
    setRaisedInformally("")
    setDesiredOutcome("")
    setDesiredOutcomeOther("")
    setErrors({})
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      resetDialog()
    }
    setDialogOpen(open)
  }

  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "Title is required."
    if (description.trim().length < 20) newErrors.description = "Description must be at least 20 characters."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleStep2Next() {
    if (validateStep2()) setStep(3)
  }

  function handleSubmit() {
    const newComplaint: Complaint = {
      id: `cmp-new-${Date.now()}`,
      strataplanId: "1",
      lotId: "l1-7",
      ownerId: "o1",
      category: category,
      title: title,
      description: description,
      submittedDate: "2026-06-18",
      status: "open",
      priority: "medium",
      managerResponse: null,
      responseDate: null,
      dueDate: "2026-07-02",
      isOverdue: false,
    }
    setLocalComplaints([newComplaint, ...localComplaints])
    setSubmitted(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Complaints</h1>
          <p className="text-slate-500 text-sm">Lot 7 · Southbank Residences</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Lodge Formal Complaint
        </Button>
      </div>

      {/* Multi-step Lodge Complaint Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div>
                <div className="text-xl font-bold text-slate-900 mb-2">Complaint Lodged</div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left">
                  <div className="font-semibold text-blue-900 mb-1">Complaint #COMP-2026-004 lodged.</div>
                  <div className="text-sm text-blue-700">Your manager must respond within 14 days (by 2 July 2026). You will be notified by email at james.chen@email.com.</div>
                </div>
              </div>
              <Button onClick={() => { setDialogOpen(false); resetDialog() }}>
                Done
              </Button>
            </div>
          ) : step === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Step 1 of 3 — Select Category</DialogTitle>
                <DialogDescription>Choose the category that best describes your complaint.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CATEGORIES.map(cat => (
                  <div
                    key={cat}
                    className={`border rounded-lg p-3 cursor-pointer text-sm transition-colors ${
                      category === cat
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-medium"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => { setCategory(cat); setStep(2) }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </>
          ) : step === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle>Step 2 of 3 — Details</DialogTitle>
                <DialogDescription>Provide the details of your complaint.</DialogDescription>
              </DialogHeader>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: "66%" }} />
              </div>

              {/* Selected category chip */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
                  {category}
                </span>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                  onClick={() => setStep(1)}
                >
                  Change
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="Brief summary of your complaint"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: "" })) }}
                  />
                  {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
                  <Textarea
                    placeholder="Describe the issue in detail. Include dates, locations, and relevant context..."
                    value={description}
                    onChange={e => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })) }}
                    rows={4}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Date of incident</label>
                  <Input
                    type="date"
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Have you raised this informally?</label>
                  <div className="flex gap-2">
                    {["Yes", "No"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`px-4 py-1.5 rounded-lg border text-sm transition-colors ${
                          raisedInformally === opt
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-medium"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                        onClick={() => setRaisedInformally(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-sm text-slate-400 cursor-pointer hover:border-slate-300"
                >
                  📎 Upload supporting documents (non-functional in demo)
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleStep2Next}>Next →</Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Step 3 of 3 — Desired Outcome</DialogTitle>
                <DialogDescription>What outcome are you seeking from this complaint?</DialogDescription>
              </DialogHeader>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: "100%" }} />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  {DESIRED_OUTCOMES.map(outcome => (
                    <div
                      key={outcome}
                      className={`border rounded-lg p-3 cursor-pointer text-sm transition-colors ${
                        desiredOutcome === outcome
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-medium"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setDesiredOutcome(outcome)}
                    >
                      {outcome}
                    </div>
                  ))}
                </div>

                {desiredOutcome === "Other (specify)" && (
                  <Input
                    placeholder="Please specify your desired outcome..."
                    value={desiredOutcomeOther}
                    onChange={e => setDesiredOutcomeOther(e.target.value)}
                  />
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!desiredOutcome}
                  >
                    Submit Complaint
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing complaints list */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Complaints</h2>
        <div className="space-y-4">
          {localComplaints.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                <div className="font-medium">No complaints on record</div>
                <div className="text-sm mt-1">Use the button above to lodge a complaint</div>
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
    </div>
  )
}
