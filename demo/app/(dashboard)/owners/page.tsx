"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockLots } from "@/lib/mock-data/lots"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { Search, Plus, Mail, Phone, Edit, ExternalLink, CheckCircle2 } from "lucide-react"

type Owner = typeof mockOwners[0]

// ── form shape shared by Add and Edit ──────────────────────────────────────
type OwnerForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  company: string
  strataPlan: string
  portalAccess: boolean
}

const EMPTY_OWNER_FORM: OwnerForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  company: "",
  strataPlan: "",
  portalAccess: false,
}

function ownerToForm(owner: Owner): OwnerForm {
  // Best-effort: map first lot to a strata plan
  const firstLotId = owner.lots[0] ?? ""
  const lot = mockLots.find(l => l.id === firstLotId)
  const plan = lot ? mockStrataPlans.find(p => p.id === lot.strataplanId) : undefined
  return {
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: owner.email,
    phone: owner.phone,
    address: owner.address,
    company: owner.company ?? "",
    strataPlan: plan?.id ?? mockStrataPlans[0]?.id ?? "",
    portalAccess: owner.portalAccess,
  }
}

function validateOwnerForm(form: OwnerForm): Partial<Record<keyof OwnerForm, string>> {
  const errs: Partial<Record<keyof OwnerForm, string>> = {}
  if (!form.firstName.trim()) errs.firstName = "Required"
  if (!form.lastName.trim()) errs.lastName = "Required"
  if (!form.email.trim()) errs.email = "Required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email"
  if (!form.phone.trim()) errs.phone = "Required"
  if (!form.address.trim()) errs.address = "Required"
  if (!form.strataPlan) errs.strataPlan = "Required"
  return errs
}

// ── Owner form dialog (Add / Edit) ─────────────────────────────────────────
function OwnerFormDialog({
  open,
  mode,
  initial,
  onClose,
}: {
  open: boolean
  mode: "add" | "edit"
  initial: OwnerForm
  onClose: () => void
}) {
  const [form, setForm] = useState<OwnerForm>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof OwnerForm, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  // Sync form when dialog opens with new initial values
  // (handled by key prop on the parent — see usage)

  function setField<K extends keyof OwnerForm>(key: K, value: OwnerForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateOwnerForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitted(true)
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setForm(initial)
      setErrors({})
      setSubmitted(false)
    }, 200)
  }

  const title = mode === "add" ? "Add Owner" : "Edit Owner"
  const successMessage =
    mode === "add"
      ? `${form.firstName} ${form.lastName} has been added.`
      : `${form.firstName} ${form.lastName}'s details have been updated.`

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">
                {mode === "add" ? "Owner Added" : "Owner Updated"}
              </p>
              <p className="text-sm text-slate-500 mt-1">{successMessage}</p>
            </div>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {mode === "add"
                  ? "Fill in the details to register a new owner."
                  : "Update the owner's information below."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* First Name + Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={e => setField("firstName", e.target.value)}
                    placeholder="James"
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={e => setField("lastName", e.target.value)}
                    placeholder="Chen"
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setField("email", e.target.value)}
                  placeholder="james.chen@email.com"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => setField("phone", e.target.value)}
                  placeholder="04XX XXX XXX"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={e => setField("address", e.target.value)}
                  placeholder="7 Collins Street, Melbourne VIC 3000"
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              {/* Company (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="company">Company <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={e => setField("company", e.target.value)}
                  placeholder="e.g. Acme Property Holdings"
                />
              </div>

              {/* Strata Plan */}
              <div className="space-y-1.5">
                <Label htmlFor="strataPlan">Strata Plan <span className="text-red-500">*</span></Label>
                <Select value={form.strataPlan} onValueChange={v => setField("strataPlan", v)}>
                  <SelectTrigger id="strataPlan">
                    <SelectValue placeholder="Select a strata plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStrataPlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.planNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.strataPlan && <p className="text-xs text-red-500">{errors.strataPlan}</p>}
              </div>

              {/* Portal Access toggle row */}
              <div
                className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  form.portalAccess ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                }`}
                onClick={() => setField("portalAccess", !form.portalAccess)}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">Grant owner portal access</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Owner can log in to view levies and documents
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.portalAccess}
                  onClick={e => { e.stopPropagation(); setField("portalAccess", !form.portalAccess) }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    form.portalAccess ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      form.portalAccess ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit">{mode === "add" ? "Add Owner" : "Save Changes"}</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Invite confirmation dialog ──────────────────────────────────────────────
function InviteDialog({
  open,
  owner,
  onClose,
}: {
  open: boolean
  owner: Owner | null
  onClose: () => void
}) {
  const [sent, setSent] = useState(false)

  function handleClose() {
    onClose()
    setTimeout(() => setSent(false), 200)
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
      <DialogContent className="max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">Invitation Sent</p>
              <p className="text-sm text-slate-500 mt-1">
                Portal invitation sent to <span className="font-medium">{owner?.email}</span>.
              </p>
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send Portal Invitation</DialogTitle>
              <DialogDescription>
                Send portal invitation to{" "}
                <span className="font-medium text-slate-700">{owner?.email}</span>?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setSent(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function OwnersPage() {
  const [search, setSearch] = useState("")

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editOwner, setEditOwner] = useState<Owner | null>(null)
  // Key forces OwnerFormDialog to remount (reset state) on each new owner
  const [editKey, setEditKey] = useState(0)

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteOwner, setInviteOwner] = useState<Owner | null>(null)

  const filtered = mockOwners.filter(o =>
    `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  )

  function getLotLabels(lotIds: string[]) {
    return lotIds.map(id => {
      const lot = mockLots.find(l => l.id === id)
      return lot?.lotNumber ?? id
    })
  }

  function getLevyStatus(ownerId: string) {
    const ownerLevies = mockLevies.filter(l => l.ownerId === ownerId)
    const hasOverdue = ownerLevies.some(l => l.status === "overdue")
    const hasUnpaid = ownerLevies.some(l => l.status === "unpaid" || l.status === "partial")
    if (hasOverdue) return "overdue"
    if (hasUnpaid) return "unpaid"
    return "current"
  }

  function openEdit(owner: Owner) {
    setEditOwner(owner)
    setEditKey(k => k + 1)
    setEditOpen(true)
  }

  function openInvite(owner: Owner) {
    setInviteOwner(owner)
    setInviteOpen(true)
  }

  return (
    <div>
      <TopNav title="Owners" breadcrumb="Portfolio" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email or lot..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Owner
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Owner", "Email", "Phone", "Lots", "Levy Status", "Portal Access", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((owner) => {
                  const levyStatus = getLevyStatus(owner.id)
                  const lotLabels = getLotLabels(owner.lots)
                  return (
                    <tr key={owner.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                            {owner.firstName[0]}{owner.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{owner.firstName} {owner.lastName}</div>
                            {owner.company && <div className="text-xs text-slate-400">{owner.company}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${owner.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {owner.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {owner.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lotLabels.map(label => (
                            <span key={label} className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {levyStatus === "overdue" ? (
                          <Badge variant="destructive">Has Overdue</Badge>
                        ) : levyStatus === "unpaid" ? (
                          <Badge variant="warning">Has Unpaid</Badge>
                        ) : (
                          <Badge variant="success">All Paid</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {owner.portalAccess ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">No access</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => openEdit(owner)}>
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Portal
                          </Button>
                          {!owner.portalAccess && (
                            <Button size="sm" variant="ghost" className="text-xs text-blue-600" onClick={() => openInvite(owner)}>
                              <Mail className="w-3.5 h-3.5 mr-1" />
                              Invite
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Add Owner dialog */}
      <OwnerFormDialog
        key="add"
        open={addOpen}
        mode="add"
        initial={EMPTY_OWNER_FORM}
        onClose={() => setAddOpen(false)}
      />

      {/* Edit Owner dialog — keyed so it fully remounts per owner */}
      {editOwner && (
        <OwnerFormDialog
          key={`edit-${editKey}`}
          open={editOpen}
          mode="edit"
          initial={ownerToForm(editOwner)}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        owner={inviteOwner}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  )
}
