import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockLots } from "@/lib/mock-data/lots"

export const GET = protectedRoute("read:plans", (req) => {
  const planId = req.nextUrl.searchParams.get("plan_id")
  const data = planId ? mockLots.filter(l => l.strataplanId === planId) : mockLots
  return apiJson({ data, count: data.length })
})

export function OPTIONS() {
  return corsPreflight()
}
