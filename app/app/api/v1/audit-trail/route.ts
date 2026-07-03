import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"

// Static mock audit events — in production these would come from an append-only log.
const auditEvents = [
  { id: "aud-001", timestamp: "2026-06-15T09:12:04+10:00", actor: "sarah.johnson@elitestrata.com.au", action: "levy.issued",        target: "LEV-2026-021", planId: "1", detail: "Q3 FY2026 admin fund levy issued to 48 lots" },
  { id: "aud-002", timestamp: "2026-06-15T09:40:31+10:00", actor: "system",                            action: "notice.sent",        target: "LEV-2026-021", planId: "1", detail: "Levy notices emailed (46) and posted (2)" },
  { id: "aud-003", timestamp: "2026-06-16T11:05:12+10:00", actor: "sarah.johnson@elitestrata.com.au", action: "expense.approved",   target: "exp-014",      planId: "2", detail: "Lift maintenance invoice approved — $2,840" },
  { id: "aud-004", timestamp: "2026-06-16T14:22:47+10:00", actor: "michael.chen@abcstrata.com.au",    action: "commission.disclosed", target: "cd-3",       planId: "3", detail: "Referral fee disclosure added to register" },
  { id: "aud-005", timestamp: "2026-06-17T08:55:19+10:00", actor: "system",                            action: "arrears.escalated",  target: "LEV-2026-009", planId: "1", detail: "Levy moved to Final Notice stage (45 days overdue)" },
  { id: "aud-006", timestamp: "2026-06-17T10:14:02+10:00", actor: "sarah.johnson@elitestrata.com.au", action: "workorder.created",  target: "WO-006",       planId: "1", detail: "Work order sent to supplier for balcony repairs" },
  { id: "aud-007", timestamp: "2026-06-17T16:31:55+10:00", actor: "owner:o7",                          action: "complaint.lodged",   target: "cmp-005",      planId: "2", detail: "Formal complaint lodged via owner portal" },
  { id: "aud-008", timestamp: "2026-06-18T09:02:40+10:00", actor: "sarah.johnson@elitestrata.com.au", action: "report.exported",    target: "audit-pack-2",  planId: "2", detail: "FY2025-26 audit package exported for external auditor" },
]

export const GET = protectedRoute("read:audit", (req) => {
  const planId = req.nextUrl.searchParams.get("plan_id")
  const data = planId ? auditEvents.filter(e => e.planId === planId) : auditEvents
  return apiJson({ data, count: data.length })
})

export function OPTIONS() {
  return corsPreflight()
}
