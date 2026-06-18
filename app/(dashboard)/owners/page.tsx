"use client"
import { useState } from "react"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockLots } from "@/lib/mock-data/lots"
import { Search, Plus, Mail, Phone, Edit, ExternalLink } from "lucide-react"

export default function OwnersPage() {
  const [search, setSearch] = useState("")

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
          <Button>
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
                          <Button size="sm" variant="ghost" className="text-xs">
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Portal
                          </Button>
                          {!owner.portalAccess && (
                            <Button size="sm" variant="ghost" className="text-xs text-blue-600">
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
    </div>
  )
}
