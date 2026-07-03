import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

export const GET = protectedRoute("read:funds", (req) => {
  const planId = req.nextUrl.searchParams.get("plan_id")
  const plans = planId ? mockStrataPlans.filter(p => p.id === planId) : mockStrataPlans

  const data = plans.map(p => ({
    strataplanId: p.id,
    planName: p.name,
    adminFundBalance: p.adminFundBalance,
    capitalWorksFundBalance: p.capitalWorksFundBalance,
    outstandingLevies: p.outstandingLevies,
    currency: "AUD",
  }))

  return apiJson({ data, count: data.length })
})

export function OPTIONS() {
  return corsPreflight()
}
