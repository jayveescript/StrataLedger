# Testing

Skeleton paths relative to `templates/skeleton/`.

## Contents
[Test pyramid in CI](#pyramid) · [Unit](#unit) · [Architecture](#architecture) · [Integration](#integration) · [Frontend](#frontend) · [Browser E2E](#smoke) · [What to cover](#coverage)

<a id="pyramid"></a>
## Every kind of test runs in GitHub Actions (`.github/workflows/ci.yml`)

| Job | Runs | Real dependencies |
|---|---|---|
| `backend` | build (warnings as errors), pending-migration check, **unit + architecture + integration** tests, TRX upload | PostgreSQL via **Testcontainers** (Docker on the runner) |
| `frontend` | lint, typecheck, **Vitest** unit/component tests, production build | — |
| `e2e` (after both) | **Playwright** against API + `vite preview`, report/trace/API log uploaded on failure | PostgreSQL **service container** with a non-superuser role |

Never use the EF Core in-memory provider as a database fake: no transactions, no raw SQL, no relational
constraints, no RLS — tests pass while production breaks. Test against real PostgreSQL.

<a id="unit"></a>
## Backend unit tests (`backend/tests/MyApp.UnitTests`)

- Domain rules (role/permission maps, invitation policy, entity invariants).
- `PipelineTests`: build a real `ServiceCollection` with `AddApplication()`, substitute `ICurrentUser`,
  `IFeatureService`, `IUnitOfWork` (NSubstitute), dispatch test requests and assert 401 → 403 → 402 → validation →
  success + `SaveChangesAsync` once. This proves the behavior order.
- Pure infrastructure helpers (billing math, CSV parser incl. formula injection, image sniffer, token hashing).
- Don't use FluentAssertions (commercial license since v8) — plain xUnit `Assert`.

<a id="architecture"></a>
## Architecture tests (`backend/tests/MyApp.ArchitectureTests`, NetArchTest.Rules + reflection)

Fail the build when the design drifts: Domain has no dependency on other layers/EF/ASP.NET; Application doesn't
reference Infrastructure/Api/Npgsql/Redis; Infrastructure doesn't reference Api; controllers are sealed, end with
`Controller`, derive from `ApiControllerBase` and never touch persistence; handlers are sealed `*Handler`; every
request has exactly one handler and is an immutable `*Command`/`*Query` record; **every request is anonymous-by-
attribute or declares `[RequiresPermission]`** (Account feature excepted); entities expose no public setters;
**every `ITenantOwned` table is in an RLS migration's `TenantTables`** (explicit, commented exemptions only).
Include non-empty sanity asserts so rules can't pass vacuously, and mutation-test a new rule once (break it, see it
fail, restore).

<a id="integration"></a>
## Integration tests (`backend/tests/MyApp.IntegrationTests`)

- `ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime`
  - Admin connection from `MYAPP_TEST_PG_ADMIN` or a Testcontainers `postgres:16-alpine` (Docker required).
  - Creates role `NOSUPERUSER NOBYPASSRLS` (idempotent under parallel fixtures via `EXCEPTION WHEN duplicate_object
    OR unique_violation`) and a throwaway database per fixture; drops it on dispose.
  - Configuration via `builder.UseSetting(key, value)` — applied before `Program` reads configuration (in-memory
    `ConfigureAppConfiguration` may be too late for code in the builder phase).
  - Environment `Testing`, background jobs off, breached-password check off, rate limiting off (a separate
    `RateLimitedApiFactory` turns it on for the 429 test), in-memory cache (no Redis).
- `TestData` arranges data through the app's own services in platform scope (`InPlatformScopeAsync`), creating staff
  with a known authenticator key.
- `Totp.Code(secret)` implements RFC 6238 so tests sign in through the real password + MFA endpoints.
- `ApiClient` sends the refresh cookie manually (TestServer is HTTP, so `Secure` cookies aren't replayed by a cookie
  container).

<a id="frontend"></a>
## Frontend tests (Vitest + Testing Library, jsdom)

- Pure logic: access rules, password policy, brand token application.
- HTTP client: mock `fetch`, assert bearer header, single-flight refresh under concurrent 401s, ApiError mapping.
- Components: render organisms inside real context providers (`AuthContext.Provider`, `BrandContext.Provider`,
  `MemoryRouter`) with fixture `me` objects (`src/test/fixtures.ts`).

<a id="smoke"></a>
## Browser E2E (Playwright, `frontend/e2e`, runs in CI)

- `playwright.config.ts`: `webServer` builds and serves the SPA with `vite preview` (same `/api` proxy as dev), one
  worker, serial flows (they share seeded accounts), traces/screenshots on failure, `PLAYWRIGHT_CHROMIUM_PATH` to use
  a preinstalled browser.
- `e2e/support/auth.ts` signs in through the UI and handles whatever step the API asks for: none, **MFA enrollment**
  (reads the setup key from the page like a user would, stores it) or TOTP verification (uses the *next* time-step,
  because replaying the current code is blocked). `e2e/support/totp.ts` is RFC 6238.
- Specs cover: end-customer role blocked from staff pages; session survives reload with **no JWT in web storage**;
  staff must enroll MFA; a CRUD flow; re-branding updates the theme immediately; Super Admin feature matrix.
- Locators: prefer roles with `exact: true`, scope repeated labels to a landmark (`getByRole('banner')`), use
  `exact` text for names that also appear in emails.
- Needs a **fresh database** (seeded staff must still be un-enrolled). CI gets one per run from the service
  container; locally drop/recreate the DB first.

Manual screenshots are still worth a look after UI changes — they caught over-allocation logic, a theme that didn't
update after save, and a success message wiped by a remount.

<a id="coverage"></a>
## Must-have integration cases for any project on this architecture

Unauthenticated → 401 ProblemDetails · security headers present · staff must enroll MFA before tokens · TOTP replay
rejected · lockout after N failures · unknown email vs wrong password indistinguishable · refresh rotation and
family revocation on replay · refresh requires CSRF header · password change revokes access tokens and blocks reuse ·
other tenant's data invisible (list + by id 404 + `?tenantId` 403) · RLS returns 0 rows unscoped · end-customer
role blocked from staff endpoints · tier limit 402 · feature outside tier 402 until granted · revoking a feature
blocks immediately · suspension kills sessions · invitation preview has no side effects · invitation single-use ·
weak/personal passwords rejected · login spam → 429.
