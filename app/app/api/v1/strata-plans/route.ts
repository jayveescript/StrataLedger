import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

export const GET = protectedRoute("read:plans", () => {
  return apiJson({ data: mockStrataPlans, count: mockStrataPlans.length })
})

export function OPTIONS() {
  return corsPreflight()
}
