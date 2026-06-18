"use client"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Users, CreditCard, Save } from "lucide-react"

export default function SettingsPage() {
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
      </div>
    </div>
  )
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={className}>{children}</span>
}
