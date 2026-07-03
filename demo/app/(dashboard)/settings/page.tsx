"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Bell, Shield, Users, CreditCard, Save, Palette, Upload, Package, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
  const [primaryColor, setPrimaryColor] = useState("#84cc16")
  const [reportHeader, setReportHeader] = useState("Elite Strata Management")
  const [emailSig, setEmailSig] = useState("Elite Strata Management | (03) 9000 1234 | info@elitestrata.com.au")
  const [brandingToast, setBrandingToast] = useState("")
  const [handoverPlan, setHandoverPlan] = useState("all")
  const [handoverConfirmOpen, setHandoverConfirmOpen] = useState(false)
  const [handoverDone, setHandoverDone] = useState(false)

  return (
    <div>
      <TopNav title="Settings" breadcrumb="Account" />
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input defaultValue="Sarah" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input defaultValue="Johnson" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue="sarah.johnson@elitestrata.com.au" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input defaultValue="0412 000 111" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input defaultValue="Elite Strata Management" />
            </div>
            <Button><Save className="w-4 h-4 mr-2" />Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Levy payment received",
              "Levy overdue (30+ days)",
              "New complaint submitted",
              "Expense pending approval",
              "AGM due in 60 days",
              "Capital works fund alert",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{item}</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full peer transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <CardTitle>Compliance & Legal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="font-semibold mb-1">Victorian OC Laws 2025</div>
              <p>StrataLedger automatically maintains your commission disclosure register as required under the Owners Corporations Amendment Act 2025. All referral fees are logged and available to lot owners.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Commission disclosure</span>
                <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Complaint SLA tracking (14 days)</span>
                <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">VCAT export package</span>
                <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <CardTitle>Plan & Billing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <div className="font-semibold text-blue-900">Manager Plan — $399/mo</div>
                <div className="text-sm text-blue-700">Up to 30 plans · Next billing: 1 July 2026</div>
              </div>
              <Button variant="outline" size="sm">Upgrade</Button>
            </div>
            <div className="text-sm text-slate-500">
              Managing <strong className="text-slate-900">3 plans</strong> of 30 allowed on your current plan.
            </div>
          </CardContent>
        </Card>

        {/* Company Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" />
              <CardTitle>Company Branding</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-slate-500">Your reports, owner portals, and correspondence will display your company branding.</p>

            <div className="space-y-1.5">
              <Label>Company Logo</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-sm text-slate-500">Click to upload logo (PNG, SVG — max 2MB)</div>
                <div className="text-xs text-slate-400 mt-1">Recommended: 200×60px</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Primary Colour</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-slate-200" />
                <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-32 font-mono text-sm" />
                <span className="text-xs text-slate-500">Used in reports, portal headers, email templates</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Report Header Text</Label>
              <Input value={reportHeader} onChange={e => setReportHeader(e.target.value)} placeholder="Your company name" />
            </div>

            <div className="space-y-1.5">
              <Label>Email Signature</Label>
              <Textarea value={emailSig} onChange={e => setEmailSig(e.target.value)} rows={2} />
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="text-xs text-slate-400 px-3 py-1.5 bg-slate-50 border-b border-slate-200">Preview — Report Header</div>
              <div className="p-4" style={{ borderTop: `3px solid ${primaryColor}` }}>
                <div className="font-bold text-slate-900 text-sm">{reportHeader}</div>
                <div className="text-xs text-slate-500">Financial Report — Southbank Residences · FY2025-26</div>
                <div className="text-xs text-slate-400 mt-0.5">Generated by StrataLedger on 18 Jun 2026</div>
              </div>
            </div>

            <Button onClick={() => { setBrandingToast("Branding saved!"); setTimeout(() => setBrandingToast(""), 3000) }}>
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
            {brandingToast && <div className="text-sm text-green-600 font-medium">✓ {brandingToast}</div>}
          </CardContent>
        </Card>

        {/* Manager Handover Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <CardTitle>Manager Handover Export</CardTitle>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
                ⭐ Not available in IntelliStrata
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-slate-500">Transfer all records to an incoming manager in one click.</p>

            <div className="space-y-1.5">
              <Label>Select Plan</Label>
              <Select value={handoverPlan} onValueChange={setHandoverPlan}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="1">Southbank Residences</SelectItem>
                  <SelectItem value="2">Collins St Apartments</SelectItem>
                  <SelectItem value="3">St Kilda Beach Villas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-medium text-slate-700 mb-1">What&apos;s included:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {["All financial statements (7 years)", "Levy history + payment records", "Expense records + receipts", "Supplier + contractor register", "AGM minutes + resolutions", "Commission disclosure register", "Complaint history", "Document archive", "Strata roll (owners + lots)", "Bank reconciliation records", "Audit trail"].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span className="text-green-500">✅</span>{item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Manager transitions only</div>
                Generating a handover pack is logged and visible to the owners corporation.
              </div>
            </div>

            <Button variant="destructive" onClick={() => setHandoverConfirmOpen(true)}>
              <Package className="w-4 h-4 mr-2" />
              Generate Handover Pack
            </Button>
          </CardContent>
        </Card>

        <Dialog open={handoverConfirmOpen} onOpenChange={setHandoverConfirmOpen}>
          <DialogContent className="max-w-md">
            {handoverDone ? (
              <div className="flex flex-col items-center py-8 gap-4 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <div className="text-slate-700 text-sm">Handover pack generating... You&apos;ll receive an email when ready.</div>
                <Button onClick={() => { setHandoverConfirmOpen(false); setHandoverDone(false) }}>Done</Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Handover Pack Generation</DialogTitle>
                  <DialogDescription>
                    This will package all records for {handoverPlan === "all" ? "all plans" : "the selected plan"} into a downloadable archive. This action is logged.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setHandoverConfirmOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => setHandoverDone(true)}>Confirm & Generate</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={className}>{children}</span>
}
