# Existing projects: audit, then adopt gradually

Never rewrite an existing product wholesale. Measure, agree a plan, and move one independently shippable step at a
time with tests green after each.

## 1. Discover

- Run `bash <skill>/scripts/audit.sh <repo>` (read-only, heuristic).
- Read the code behind each row — a ✅ only means evidence exists. Note: framework versions, DB, auth mechanism, how
  tenancy is represented (if at all), where business logic lives, test coverage, deployment.
- Identify the project's own naming (Company/Organization/Workspace, role names) and keep it.

## 2. Report (use this format)

```markdown
# Architecture gap report: <project>

## Summary
<3–5 sentences: current shape, biggest risks, recommended first steps>

## Findings
| # | Area | Current state (file:line) | Risk | Target pattern (reference) | Effort |
|---|------|---------------------------|------|----------------------------|--------|

## Proposed plan (ordered)
1. <step> — why now, what changes, how it's verified, rollback
2. …

## Out of scope / decisions needed
- <question for the user>
```

Rate risk by impact: data leak across tenants and token theft first, then abuse/availability, then maintainability.

## 3. Safe adoption order

Each step lists its verification. Stop after any step if the user wants.

1. **Baseline & safety net** — make build + existing tests run in CI; add a few integration tests around current
   auth and the main endpoints (they protect every later step).
2. **Cheap hardening** — security headers, explicit CORS, central exception handler + ProblemDetails, health checks.
   *Verify:* header test, error shape test.
3. **Abuse protection** — rate limiting (auth per IP, global per user), Redis if multi-instance. *Verify:* 429 test.
4. **Auth hardening** — lockout, password validators, uniform login errors; move tokens out of `localStorage` to
   memory + HttpOnly refresh cookie with rotation/reuse detection (ship API support first, then switch the SPA,
   then remove the old path); session revocation via security stamp; MFA for privileged roles. *Verify:* the auth
   integration cases in `testing.md`.
5. **Authorization model** — role → permission map, permission/feature attributes, default-deny fallback policy.
   *Verify:* 403 matrix tests per role.
6. **Tenancy** (if multi-tenant) — add tenant key + backfill, `ResolveTenant`, EF filters, then RLS behind a
   non-superuser role (enable per table, after the filters are proven). *Verify:* cross-tenant tests + RLS test.
7. **Structure** — introduce dispatcher + behaviors and move endpoints to thin controllers **module by module**
   (strangler pattern); new code uses the pattern immediately. *Verify:* existing tests unchanged.
8. **Audit & monetisation** — auditing interceptor, security event log, tiers/features/limits if the product sells
   plans.
9. **Frontend** — http client with single-flight refresh, access rules + data-driven nav, atomic folders for new
   components (move old ones when touched), brand tokens if white-label is needed.
10. **Ops** — Dockerfiles, compose for local, CI checks (including pending-migration check).

## Guardrails

- Keep public API contracts stable; version (`/api/v2`) or add alongside when a breaking change is unavoidable.
- Data migrations are reversible or backed up; tenant backfills run in batches.
- Don't introduce a second pattern for something the codebase already does acceptably — note it and move on.
