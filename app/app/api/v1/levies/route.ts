import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockLevies } from "@/lib/mock-data/levies"

export const GET = protectedRoute("read:levies", (req) => {
  const { searchParams } = req.nextUrl
  const status = searchParams.get("status")
  const planId = searchParams.get("plan_id")

  let data = mockLevies
  if (status) data = data.filter(l => l.status === status)
  if (planId) data = data.filter(l => l.strataplanId === planId)

  return apiJson({ data, count: data.length })
})

export function OPTIONS() {
  return corsPreflight()
}
