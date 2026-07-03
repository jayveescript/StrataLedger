import { protectedRoute } from "@/lib/api/auth"
import { apiJson, corsPreflight } from "@/lib/api/respond"
import { mockOwners } from "@/lib/mock-data/owners"

// Owner records contain PII, so this endpoint sits behind its own scope.
export const GET = protectedRoute("read:owners", () => {
  return apiJson({ data: mockOwners, count: mockOwners.length })
})

export function OPTIONS() {
  return corsPreflight()
}
