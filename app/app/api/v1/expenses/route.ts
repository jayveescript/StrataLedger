import type { NextRequest } from "next/server"
import { authenticate, protectedRoute } from "@/lib/api/auth"
import { apiError, apiJson, corsPreflight } from "@/lib/api/respond"
import { mockExpenses } from "@/lib/mock-data/expenses"
import { mockStrataPlans } from "@/lib/mock-data/strata-plans"

const VALID_CATEGORIES = ["cleaning", "insurance", "gardening", "management-fee", "utilities", "maintenance", "legal"]
const VALID_FUNDS = ["admin", "capital-works"]

export const GET = protectedRoute("read:expenses", (req) => {
  const { searchParams } = req.nextUrl
  const planId = searchParams.get("plan_id")
  const category = searchParams.get("category")

  let data = mockExpenses
  if (planId) data = data.filter(e => e.strataplanId === planId)
  if (category) data = data.filter(e => e.category === category)

  return apiJson({ data, count: data.length })
})

export async function POST(req: NextRequest) {
  const auth = await authenticate(req, "write:expenses")
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return apiError(400, "invalid_request", "Request body must be valid JSON")
  }

  const planId = String(body.strataplan_id ?? "")
  const vendor = String(body.vendor ?? "").trim()
  const amount = Number(body.amount)
  const category = String(body.category ?? "")
  const fund = String(body.fund ?? "")
  const description = String(body.description ?? "").trim()

  if (!mockStrataPlans.some(p => p.id === planId)) {
    return apiError(422, "validation_failed", `Unknown strataplan_id "${planId}"`)
  }
  if (!vendor) return apiError(422, "validation_failed", "vendor is required")
  if (!Number.isFinite(amount) || amount <= 0) {
    return apiError(422, "validation_failed", "amount must be a positive number")
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return apiError(422, "validation_failed", `category must be one of: ${VALID_CATEGORIES.join(", ")}`)
  }
  if (!VALID_FUNDS.includes(fund)) {
    return apiError(422, "validation_failed", `fund must be one of: ${VALID_FUNDS.join(", ")}`)
  }

  const created = {
    id: `exp-${crypto.randomUUID().slice(0, 8)}`,
    strataplanId: planId,
    date: new Date().toISOString().slice(0, 10),
    vendor,
    amount,
    category,
    fund,
    description,
    status: "pending",
    submittedBy: auth.ctx.clientId,
  }

  return apiJson(
    { data: created, note: "Demo environment: writes are validated and echoed but not persisted." },
    { status: 201 }
  )
}

export function OPTIONS() {
  return corsPreflight()
}
