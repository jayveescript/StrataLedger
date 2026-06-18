"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { mockAGMs } from "@/lib/mock-data/agm"
import { formatDate } from "@/lib/utils"
import {
  Calendar, MapPin, Users, Send, FileText,
  UserCheck, CheckCircle2, XCircle, Download, UserPlus,
} from "lucide-react"

// ---------- Send AGM Notice dialog ----------

interface NoticeForm {
  deliveryMethod: string
  sendDate: string
  subjectLine: string
  coverLetter: string
  includeFinancials: boolean
  includeProxy: boolean
  includeNomination: boolean
  includeInsurance: boolean
}

const EMPTY_NOTICE: NoticeForm = {
  deliveryMethod: "",
  sendDate: "",
  subjectLine: "",
  coverLetter: "",
  includeFinancials: false,
  includeProxy: false,
  includeNomination: false,
  includeInsurance: false,
}

function SendNoticeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState<NoticeForm>(EMPTY_NOTICE)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof NoticeForm, string>>>({})

  function reset() {
    setForm(EMPTY_NOTICE)
    setErrors({})
    setSubmitted(false)
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof NoticeForm, string>> = {}
    if (!form.deliveryMethod) next.deliveryMethod = "Please select a delivery method."
    if (!form.sendDate) next.sendDate = "Send date is required."
    if (!form.subjectLine.trim()) next.subjectLine = "Subject line is required."
    if (!form.coverLetter.trim()) next.coverLetter = "Cover letter is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <div>
              <div className="text-lg font-semibold text-slate-900 mb-1">Notices Queued</div>
              <div className="text-sm text-slate-500">AGM notices queued for dispatch to 48 lot owners.</div>
            </div>
            <Button onClick={() => { reset(); onOpenChange(false) }} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send AGM Notice</DialogTitle>
              <DialogDescription>
                Configure and dispatch notice of the Annual General Meeting to all lot owners.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Delivery Method */}
              <div className="space-y-1.5">
                <Label htmlFor="agm-delivery">Notice Delivery Method <span className="text-red-500">*</span></Label>
                <Select
                  value={form.deliveryMethod}
                  onValueChange={v => setForm(f => ({ ...f, deliveryMethod: v }))}
                >
                  <SelectTrigger id="agm-delivery">
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email only</SelectItem>
                    <SelectItem value="post">Post only</SelectItem>
                    <SelectItem value="email-post">Email and Post</SelectItem>
                  </SelectContent>
                </Select>
                {errors.deliveryMethod && <p className="text-xs text-red-500">{errors.deliveryMethod}</p>}
              </div>

              {/* Send Date */}
              <div className="space-y-1.5">
                <Label htmlFor="agm-senddate">Send Date <span className="text-red-500">*</span></Label>
                <Input
                  id="agm-senddate"
                  type="date"
                  value={form.sendDate}
                  onChange={e => setForm(f => ({ ...f, sendDate: e.target.value }))}
                />
                {errors.sendDate && <p className="text-xs text-red-500">{errors.sendDate}</p>}
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <Label htmlFor="agm-subject">Subject Line <span className="text-red-500">*</span></Label>
                <Input
                  id="agm-subject"
                  placeholder="Notice of Annual General Meeting — Southbank Residences 2026"
                  value={form.subjectLine}
                  onChange={e => setForm(f => ({ ...f, subjectLine: e.target.value }))}
                />
                {errors.subjectLine && <p className="text-xs text-red-500">{errors.subjectLine}</p>}
              </div>

              {/* Cover Letter */}
              <div className="space-y-1.5">
                <Label htmlFor="agm-cover">Cover Letter / Message <span className="text-red-500">*</span></Label>
                <Textarea
                  id="agm-cover"
                  rows={4}
                  placeholder="Dear Lot Owner, You are hereby given notice of the Annual General Meeting..."
                  value={form.coverLetter}
                  onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))}
                />
                {errors.coverLetter && <p className="text-xs text-red-500">{errors.coverLetter}</p>}
              </div>

              {/* Include Documents */}
              <div className="space-y-2">
                <Label>Include Documents</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {/* Agenda — pre-checked, disabled */}
                  <label className="flex items-center gap-2 text-sm text-slate-500 cursor-not-allowed select-none">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="rounded border-slate-300 text-blue-500 accent-blue-500"
                    />
                    Agenda
                  </label>
                  {/* Financial Statements */}
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.includeFinancials}
                      onChange={e => setForm(f => ({ ...f, includeFinancials: e.target.checked }))}
                      className="rounded border-slate-300 accent-blue-500"
                    />
                    Financial Statements 2025–26
                  </label>
                  {/* Proxy Form */}
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.includeProxy}
                      onChange={e => setForm(f => ({ ...f, includeProxy: e.target.checked }))}
                      className="rounded border-slate-300 accent-blue-500"
                    />
                    Proxy Form
                  </label>
                  {/* Nomination Form */}
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.includeNomination}
                      onChange={e => setForm(f => ({ ...f, includeNomination: e.target.checked }))}
                      className="rounded border-slate-300 accent-blue-500"
                    />
                    Nomination Form
                  </label>
                  {/* Building Insurance Certificate */}
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.includeInsurance}
                      onChange={e => setForm(f => ({ ...f, includeInsurance: e.target.checked }))}
                      className="rounded border-slate-300 accent-blue-500"
                    />
                    Building Insurance Certificate
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notice
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Register Proxy dialog ----------

interface ProxyForm {
  lotNumber: string
  ownerName: string
  proxyTo: string
  receivedDate: string
  notes: string
}

const EMPTY_PROXY: ProxyForm = {
  lotNumber: "",
  ownerName: "",
  proxyTo: "",
  receivedDate: "",
  notes: "",
}

function RegisterProxyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState<ProxyForm>(EMPTY_PROXY)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProxyForm, string>>>({})

  function reset() {
    setForm(EMPTY_PROXY)
    setErrors({})
    setSubmitted(false)
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  function validate(): boolean {
    const next: Partial<Record<keyof ProxyForm, string>> = {}
    if (!form.lotNumber.trim()) next.lotNumber = "Lot number is required."
    if (!form.ownerName.trim()) next.ownerName = "Owner name is required."
    if (!form.proxyTo.trim()) next.proxyTo = "Proxy appointed to is required."
    if (!form.receivedDate) next.receivedDate = "Received date is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitted(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <div>
              <div className="text-lg font-semibold text-slate-900 mb-1">Proxy Registered</div>
              <div className="text-sm text-slate-500">Proxy registered for AGM 2026.</div>
            </div>
            <Button onClick={() => { reset(); onOpenChange(false) }} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register Proxy</DialogTitle>
              <DialogDescription>
                Record a proxy appointment for the upcoming AGM 2026.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Lot Number */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-lot">Lot Number <span className="text-red-500">*</span></Label>
                <Input
                  id="proxy-lot"
                  placeholder="e.g. Lot 12"
                  value={form.lotNumber}
                  onChange={e => setForm(f => ({ ...f, lotNumber: e.target.value }))}
                />
                {errors.lotNumber && <p className="text-xs text-red-500">{errors.lotNumber}</p>}
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-owner">Owner Name <span className="text-red-500">*</span></Label>
                <Input
                  id="proxy-owner"
                  placeholder="Full name of lot owner"
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                />
                {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName}</p>}
              </div>

              {/* Proxy Appointed To */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-to">Proxy Appointed To <span className="text-red-500">*</span></Label>
                <Input
                  id="proxy-to"
                  placeholder="Name of person holding proxy"
                  value={form.proxyTo}
                  onChange={e => setForm(f => ({ ...f, proxyTo: e.target.value }))}
                />
                {errors.proxyTo && <p className="text-xs text-red-500">{errors.proxyTo}</p>}
              </div>

              {/* Proxy Form Received */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-received">Proxy Form Received <span className="text-red-500">*</span></Label>
                <Input
                  id="proxy-received"
                  type="date"
                  value={form.receivedDate}
                  onChange={e => setForm(f => ({ ...f, receivedDate: e.target.value }))}
                />
                {errors.receivedDate && <p className="text-xs text-red-500">{errors.receivedDate}</p>}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="proxy-notes">Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  id="proxy-notes"
                  placeholder="e.g. Limited proxy — motion 3 only"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                <Button type="submit">Register Proxy</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Page ----------

export default function AGMPage() {
  const upcoming = mockAGMs.find(a => a.status === "scheduled")!
  const completed = mockAGMs.find(a => a.status === "completed")!

  const [noticeOpen, setNoticeOpen] = useState(false)
  const [proxyOpen, setProxyOpen] = useState(false)

  return (
    <div>
      <TopNav title="AGM & Voting" breadcrumb="Governance" />
      <div className="p-6 space-y-6">
        {/* Upcoming AGM card */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Upcoming AGM</div>
                <CardTitle>Southbank Residences AGM 2026</CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-0">Scheduled — 58 days away</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-xs text-slate-400">Date</div>
                  <div className="font-medium">{formatDate(upcoming.date)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400">Location</div>
                  <div className="font-medium text-sm leading-snug">{upcoming.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-xs text-slate-400">Quorum Required</div>
                  <div className="font-medium">25% — {upcoming.quorumRequired} lots</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setNoticeOpen(true)}>
                <Send className="w-4 h-4 mr-2" />
                Send AGM Notice
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Agenda
              </Button>
              <Button variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Manage Proxies
              </Button>
              <Button variant="outline" onClick={() => setProxyOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Register Proxy
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {upcoming.agenda.map((item) => {
                  const motion = upcoming.motions.find(m => m.id === item.motionId)
                  return (
                    <div key={item.id} className="flex gap-4 p-4">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-sm">{item.title}</div>
                        {motion && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-xs text-amber-700 font-semibold mb-1">MOTION — PENDING VOTE</div>
                            <div className="text-xs text-amber-800 leading-relaxed">{motion.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Proxies */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Proxies ({upcoming.proxies.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Lot", "Proxy Appointed To", "Received", "Valid"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcoming.proxies.map((proxy, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">Lot {proxy.lotId.split("-")[1]}</td>
                        <td className="px-4 py-3 text-slate-700">{proxy.proxyTo}</td>
                        <td className="px-4 py-3 text-slate-700 text-xs">{formatDate(proxy.receivedDate)}</td>
                        <td className="px-4 py-3">
                          {proxy.valid
                            ? <Badge variant="success">Valid</Badge>
                            : <Badge variant="destructive">Invalid</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Past AGM results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Past Results — Collins St 2025</CardTitle>
                  <Button size="sm" variant="outline">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Minutes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Motion", "For", "Against", "Result"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completed.motions.map(motion => (
                      <tr key={motion.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900 font-medium text-xs max-w-[180px] truncate">{motion.title}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{motion.votesFor}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{motion.votesAgainst}</td>
                        <td className="px-4 py-3">
                          {motion.passed
                            ? <div className="flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Passed</div>
                            : <div className="flex items-center gap-1 text-red-600 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Failed</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 text-xs text-slate-400 border-t border-slate-100">
                  {formatDate(completed.date)} · {completed.location} · Quorum: {completed.quorumAchieved}/{completed.quorumRequired} lots
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SendNoticeDialog open={noticeOpen} onOpenChange={setNoticeOpen} />
      <RegisterProxyDialog open={proxyOpen} onOpenChange={setProxyOpen} />
    </div>
  )
}
