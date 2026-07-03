import type { NextRequest } from "next/server"
import { authenticate } from "@/lib/api/auth"
import { apiError, apiJson, corsPreflight } from "@/lib/api/respond"
import { mockLevies } from "@/lib/mock-data/levies"

const VALID_METHODS = ["bank_transfer", "bpay", "card"]

export async function POST(req: NextRequest) {
  const auth = await authenticate(req, "write:payments")
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return apiError(400, "invalid_request", "Request body must be valid JSON")
  }

  const reference = String(body.levy_reference ?? "")
  const amount = Number(body.amount)
  const method = String(body.method ?? "")

  const levy = mockLevies.find(l => l.reference === reference)
  if (!levy) {
    return apiError(422, "validation_failed", `Unknown levy_reference "${reference}"`)
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return apiError(422, "validation_failed", "amount must be a positive number")
  }
  const outstanding = levy.amount - levy.paidAmount
  if (amount > outstanding) {
    return apiError(422, "validation_failed", `amount exceeds outstanding balance of ${outstanding}`)
  }
  if (!VALID_METHODS.includes(method)) {
    return apiError(422, "validation_failed", `method must be one of: ${VALID_METHODS.join(", ")}`)
  }

  return apiJson(
    {
      data: {
        paymentId: crypto.randomUUID(),
        levyReference: levy.reference,
        amount,
        method,
        receivedAt: new Date().toISOString(),
        status: "settled",
        recordedBy: auth.ctx.clientId,
      },
      note: "Demo environment: payments are validated and echoed but not persisted.",
    },
    { status: 201 }
  )
}

export function OPTIONS() {
  return corsPreflight()
}
