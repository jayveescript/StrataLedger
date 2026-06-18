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
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { Building2, MapPin, Search, Plus, Calendar, Users, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

const STATES = ["VIC", "NSW", "QLD", "WA", "SA", "ACT", "TAS", "NT"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const EMPTY_FORM = {
  planName: "",
  planNumber: "",
  streetAddress: "",
  suburb: "",
  state: "VIC",
  postcode: "",
  totalLots: "",
  financialYearStart: "July",
}

function HealthBadge({ status }: { status: string }) {
  if (status === "healthy") return <Badge variant="success">Healthy</Badge>
  if (status === "at-risk") return <Badge variant="warning">At Risk</Badge>
  return <Badge variant="destructive">Critical</Badge>
}

export default function StrataPlansPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({})

  const filtered = mockStrataPlans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.planNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  )

  function handleOpen() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitted(false)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false)
      setForm(EMPTY_FORM)
      setErrors({})
    }, 200)
  }

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: Partial<typeof EMPTY_FORM> = {}
    if (!form.planName.trim()) next.planName = "Required"
    if (!form.planNumber.trim()) next.planNumber = "Required"
    if (!form.streetAddress.trim()) next.streetAddress = "Required"
    if (!form.suburb.trim()) next.suburb = "Required"
    if (!form.postcode.trim()) next.postcode = "Required"
    else if (!/^\d{4}$/.test(form.postcode)) next.postcode = "Must be 4 digits"
    if (!form.totalLots) next.totalLots = "Required"
    else if (Number(form.totalLots) < 2) next.totalLots = "Minimum 2 lots"
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitted(true)
  }

  return (
    <div>
      <TopNav title="Strata Plans" breadcrumb="Portfolio" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleOpen}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <HealthBadge status={plan.healthStatus} />
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                  </div>
                  <div className="inline-flex items-center bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono mb-2">
                    {plan.planNumber}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {plan.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Lots</div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">{plan.totalLots}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Next AGM</div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900 text-xs">{formatDate(plan.nextAGM)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Admin Fund</span>
                    <span className="font-medium text-blue-700">{formatCurrency(plan.adminFundBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Capital Works Fund</span>
                    <span className="font-medium text-green-700">{formatCurrency(plan.capitalWorksFundBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Outstanding Levies</span>
                    <span className={`font-medium ${plan.outstandingLevies > 0 ? "text-red-600" : "text-green-600"}`}>
                      {plan.outstandingLevies > 0 ? formatCurrency(plan.outstandingLevies) : "None"}
                    </span>
                  </div>
                </div>

                <Link href={`/strata-plans/${plan.id}`} className="block">
                  <Button className="w-full" variant="outline">
                    View Details →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) handleClose() }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Plan Added Successfully</p>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-medium">{form.planName}</span> has been added to the portfolio.
                </p>
              </div>
              <Button onClick={handleClose} className="mt-2">Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Strata Plan</DialogTitle>
                <DialogDescription>Enter the details for the new strata plan.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                {/* Plan Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="planName">Plan Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="planName"
                    value={form.planName}
                    onChange={e => setField("planName", e.target.value)}
                    placeholder="e.g. Southbank Residences"
                  />
                  {errors.planName && <p className="text-xs text-red-500">{errors.planName}</p>}
                </div>

                {/* Plan Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="planNumber">Plan Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="planNumber"
                    value={form.planNumber}
                    onChange={e => setField("planNumber", e.target.value)}
                    placeholder="OC-SP-000456"
                  />
                  {errors.planNumber && <p className="text-xs text-red-500">{errors.planNumber}</p>}
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="streetAddress">Street Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="streetAddress"
                    value={form.streetAddress}
                    onChange={e => setField("streetAddress", e.target.value)}
                    placeholder="e.g. 123 Collins Street"
                  />
                  {errors.streetAddress && <p className="text-xs text-red-500">{errors.streetAddress}</p>}
                </div>

                {/* Suburb + State + Postcode row */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="suburb">Suburb <span className="text-red-500">*</span></Label>
                    <Input
                      id="suburb"
                      value={form.suburb}
                      onChange={e => setField("suburb", e.target.value)}
                      placeholder="e.g. Melbourne"
                    />
                    {errors.suburb && <p className="text-xs text-red-500">{errors.suburb}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                    <Select value={form.state} onValueChange={v => setField("state", v)}>
                      <SelectTrigger id="state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label htmlFor="postcode">Postcode <span className="text-red-500">*</span></Label>
                    <Input
                      id="postcode"
                      value={form.postcode}
                      onChange={e => setField("postcode", e.target.value)}
                      placeholder="3000"
                      maxLength={4}
                    />
                    {errors.postcode && <p className="text-xs text-red-500">{errors.postcode}</p>}
                  </div>
                </div>

                {/* Total Lots + Financial Year Start row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="totalLots">Total Lots <span className="text-red-500">*</span></Label>
                    <Input
                      id="totalLots"
                      type="number"
                      min={2}
                      value={form.totalLots}
                      onChange={e => setField("totalLots", e.target.value)}
                      placeholder="e.g. 24"
                    />
                    {errors.totalLots && <p className="text-xs text-red-500">{errors.totalLots}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="financialYearStart">Financial Year Start <span className="text-red-500">*</span></Label>
                    <Select value={form.financialYearStart} onValueChange={v => setField("financialYearStart", v)}>
                      <SelectTrigger id="financialYearStart">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button type="submit">Add Plan</Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
