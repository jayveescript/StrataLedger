"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { Building2, MapPin, Search, Plus, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

function HealthBadge({ status }: { status: string }) {
  if (status === "healthy") return <Badge variant="success">Healthy</Badge>
  if (status === "at-risk") return <Badge variant="warning">At Risk</Badge>
  return <Badge variant="destructive">Critical</Badge>
}

export default function StrataPlansPage() {
  const [search, setSearch] = useState("")

  const filtered = mockStrataPlans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.planNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  )

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
          <Button>
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
    </div>
  )
}
