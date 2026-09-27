---
name: dotnet-react-saas
description: >-
  Architecture, conventions and a runnable skeleton for production-grade multi-tenant SaaS: ASP.NET Core Web API
  (controllers, CQRS + repository, EF Core/LINQ, PostgreSQL) plus React + Vite + TypeScript (atomic design, TanStack
  Query, Tailwind, per-tenant white-label branding). Covers JWT + rotating HttpOnly refresh cookies, TOTP MFA,
  role/permission/feature authorization, tenant isolation (EF filters + Postgres RLS), pricing tiers and feature
  gating, invitation email lists, audit logs, Redis rate limiting, Docker, CI and tests. Use whenever the user
  starts, extends, secures, reviews or refactors a .NET API and/or React frontend, new or existing: "build a .NET
  backend", "add a module/endpoint/page", "make it multi-tenant", "add roles/permissions/MFA/refresh tokens", "add
  pricing tiers", "make the UI brandable", "audit my API security", "use my usual architecture" - even if the skill
  isn't named.
---

# .NET + React multi-tenant SaaS architecture

A proven, end-to-end architecture (reference implementation: StrataLedger) packaged as rules, reference docs and a
**buildable skeleton** (`templates/skeleton/`: 70 backend incl. architecture tests, 19 frontend and 5 browser E2E tests passing in CI). The goal is that every
project built with it is secure by default, consistent, and easy to extend one vertical slice at a time.

## Pick the mode first

| Situation | Mode | Start with |
|---|---|---|
| New project / empty repo | **Greenfield** | `scripts/new-project.sh <dir> <PascalName>` then replace the example `Items` module |
| Existing codebase (any state) | **Audit → adopt gradually** | `scripts/audit.sh <repo>` → `references/existing-project-audit.md` |
| Project already on this architecture | **Add a feature** | "Feature slice recipe" in `references/backend-architecture.md` + `references/frontend-architecture.md` |
| Security review / hardening request | **Audit (security subset)** | `references/security.md` checklist |

Ask the user only what the code can't tell you (tenancy model, roles, tiers, hosting, DB). Mirror existing
conventions in an existing repo rather than imposing new names.

## Non-negotiables (why they matter)

1. **Controllers are thin.** Each action builds a command/query and returns `Send(...)`; a lookup table maps
   `ErrorType` → HTTP status. Business logic in controllers is untestable and duplicates authorization.
2. **CQRS via an in-house dispatcher** (`IRequest<T>` → `Result<T>`), with pipeline behaviors in this order:
   Logging → Authorization → Validation → Transaction. Authorization runs before validation so unauthenticated
   callers learn nothing about payload rules. (MediatR is commercially licensed since 2025 — don't add it.)
3. **Authorization twice.** Controller attributes (`[Authorize(Roles)]`, `[HasPermission]`, `[FeatureGate]`) *and*
   request attributes (`[RequiresPermission]`, `[RequiresFeature]`). Default is deny: anything not marked
   `[AllowAnonymousRequest]` needs an authenticated user.
4. **Lookups over branching.** Roles→permissions, invitable roles, error→status, template registry, next sign-in step:
   `FrozenDictionary`/`Record<>` maps and switch expressions instead of if/else chains.
5. **Tenant isolation in two layers.** EF global query filters *and* Postgres RLS (`FORCE ROW LEVEL SECURITY`) driven
   by a per-connection `app.tenant_id`. The app DB role must be non-superuser without `BYPASSRLS`, or RLS silently
   does nothing.
6. **Tokens:** short RS256 access token in SPA memory only; refresh token rotating, hashed at rest, in an
   `HttpOnly; Secure; SameSite=Strict` cookie scoped to the auth path, with reuse detection and a CSRF header.
   Never put tokens in `localStorage`.
7. **Every write is async, transactional, audited**, every list is paged (max 100), every endpoint rate-limited.
8. **Monetisation is data, not code:** tiers + features + limits + per-tenant overrides; missing feature → `402`,
   and the UI shows a lock/upsell instead of hiding silently.
9. **Frontend is atomic and data-driven:** atoms → molecules → organisms → templates → pages; menu and route guards
   come from one access-rule shape (`roles`, `permission`, `feature` → `allowed | forbidden | locked`); branding is
   CSS variables set from the signed-in tenant.
10. **Prove it runs, in CI.** Unit, architecture, integration (real Postgres via Testcontainers — never the EF
    in-memory provider), frontend unit tests and Playwright E2E all run in GitHub Actions. Report anything not verified.

## Where the details live (load only what the task needs)

| Read this | When |
|---|---|
| `references/backend-architecture.md` | Solution layout, dispatcher/behaviors, Result mapping, repositories, controllers, **feature slice recipe** |
| `references/multi-tenancy.md` | Tenant key, query filters, TenantContext, RLS migration, `ResolveTenant`, platform scope |
| `references/security.md` | Identity/passwords, JWT + refresh, MFA, revocation, rate limiting, headers, uploads, audit |
| `references/monetisation.md` | Tiers, features, limits, overrides, 402 semantics, billing seam, upsell UI |
| `references/frontend-architecture.md` | Folder map, atomic rules, http client, auth flow, access rules, branding, forms, routing |
| `references/testing.md` | Unit pipeline tests, integration factory with non-superuser DB, TOTP helper, Vitest, Playwright smoke |
| `references/ops.md` | Dockerfiles, nginx CSP/proxy, compose, CI, production checklist |
| `references/existing-project-audit.md` | Gap report format and the safe adoption order for existing repos |
| `references/lessons-learned.md` | Pitfalls that actually bit during the reference build — skim before finishing any task |

The skeleton is the source of truth for code: open the real file (paths are given in each reference) instead of
retyping patterns from memory.

## Greenfield workflow

1. Confirm: product name, tenant noun (Company/Organization/Workspace), roles, first real module, tiers, DB, hosting.
2. `bash <skill>/scripts/new-project.sh <target> <Name>`; build and run tests before changing anything.
3. Rename the tenant noun / roles if they differ (enums in `Domain/Enums`, `Roles.cs`, `RolePermissions.cs`, FE
   `api/types.ts`, `lib/navigation.ts`).
4. Replace `Items` with the first real module using the feature slice recipe; add its table to the RLS migration list.
5. Regenerate migrations (`dotnet ef migrations add ...`), run tests, run the app, smoke-test in a browser.

## Existing-project workflow

1. Run `scripts/audit.sh <repo>` (read-only) and read the code behind each ✅/❌ — the script is a heuristic.
2. Write the gap report (format in `references/existing-project-audit.md`) and propose steps in the safe order.
   Never rewrite wholesale; each step ships independently with tests green.
3. Implement only the steps the user approves, adapting names to the codebase's conventions.

## Definition of done

- `dotnet build` (warnings as errors) and `dotnet test` (unit + architecture + integration on real Postgres) pass;
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass; `npm run e2e` passes for changed flows.
  All of these run in GitHub Actions — a new kind of test isn't done until CI runs it.
- New endpoints: permission + feature attributes on controller *and* request, validator, paging if listing,
  integration test for the forbidden/other-tenant case.
- New tenant tables: `ITenantOwned`/`TenantEntity`, RLS policy added, soft delete where history matters.
- Changed UI flow exercised in a real browser; anything not verified is stated plainly.
