import type { NextRequest } from "next/server"
import { authenticate } from "@/lib/api/auth"
import { apiError, apiJson, corsPreflight } from "@/lib/api/respond"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"
import { mockLots } from "@/lib/mock-data/lots"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req, "read:plans")
  if (!auth.ok) return auth.response

  const { id } = await params
  const plan = mockStrataPlans.find(p => p.id === id)
  if (!plan) return apiError(404, "not_found", `No strata plan with id "${id}"`)

  const lots = mockLots.filter(l => l.strataplanId === id)
  return apiJson({ data: { ...plan, lots } })
}

export function OPTIONS() {
  return corsPreflight()
}
