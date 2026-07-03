import { protectedRoute } from "@/lib/api/auth"
import { apiError, apiJson, corsPreflight } from "@/lib/api/respond"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { mockLevies } from "@/lib/mock-data/levies"
import { mockExpenses } from "@/lib/mock-data/expenses"

export const GET = protectedRoute("read:reports", (req) => {
  const planId = req.nextUrl.searchParams.get("plan_id")
  if (!planId) return apiError(400, "invalid_request", "plan_id query parameter is required")

  const plan = mockStrataPlans.find(p => p.id === planId)
  if (!plan) return apiError(404, "not_found", `No strata plan with id "${planId}"`)

  const levies = mockLevies.filter(l => l.strataplanId === planId)
  const expenses = mockExpenses.filter(e => e.strataplanId === planId)

  const income = {
    leviesIssued: levies.reduce((sum, l) => sum + l.amount, 0),
    leviesCollected: levies.reduce((sum, l) => sum + l.paidAmount, 0),
    byFund: {
      admin: levies.filter(l => l.fund === "admin").reduce((sum, l) => sum + l.paidAmount, 0),
      capitalWorks: levies.filter(l => l.fund === "capital-works").reduce((sum, l) => sum + l.paidAmount, 0),
    },
  }

  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount
  }

  return apiJson({
    data: {
      plan: { id: plan.id, name: plan.name, planNumber: plan.planNumber, state: plan.state },
      financialYearStart: plan.financialYearStart,
      income,
      expenses: {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        byCategory: expensesByCategory,
      },
      balances: {
        adminFund: plan.adminFundBalance,
        capitalWorksFund: plan.capitalWorksFundBalance,
      },
      currency: "AUD",
    },
  })
})

export function OPTIONS() {
  return corsPreflight()
}
