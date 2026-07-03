import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockLots } from "@/lib/mock-data/lots"
import { mockOwners } from "@/lib/mock-data/owners"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

export const GET = protectedRoute("read:reports", (req) => {
  const planId = req.nextUrl.searchParams.get("plan_id")

  let arrears = mockLevies.filter(l => l.status === "overdue" || l.status === "partial")
  if (planId) arrears = arrears.filter(l => l.strataplanId === planId)

  const data = arrears.map(levy => {
    const lot = mockLots.find(l => l.id === levy.lotId)
    const owner = mockOwners.find(o => o.id === levy.ownerId)
    const plan = mockStrataPlans.find(p => p.id === levy.strataplanId)
    return {
      reference: levy.reference,
      plan: plan?.name,
      lot: lot?.lotNumber,
      owner: owner ? `${owner.firstName} ${owner.lastName}` : null,
      amount: levy.amount,
      paidAmount: levy.paidAmount,
      outstanding: levy.amount - levy.paidAmount,
      dueDate: levy.dueDate,
      status: levy.status,
      fund: levy.fund,
      quarter: levy.quarter,
    }
  })

  return apiJson({
    data,
    count: data.length,
    totalOutstanding: data.reduce((sum, a) => sum + a.outstanding, 0),
    currency: "AUD",
  })
})

export function OPTIONS() {
  return corsPreflight()
}
