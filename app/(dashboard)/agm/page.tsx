"use client"
import { TopNav } from "@/components/layout/TopNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockAGMs } from "@/lib/mock-data/agm"
import { formatDate } from "@/lib/utils"
import {
  Calendar, MapPin, Users, Send, FileText,
  UserCheck, CheckCircle2, XCircle, Download
} from "lucide-react"

export default function AGMPage() {
  const upcoming = mockAGMs.find(a => a.status === "scheduled")!
  const completed = mockAGMs.find(a => a.status === "completed")!

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
              <Button>
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
    </div>
  )
}
