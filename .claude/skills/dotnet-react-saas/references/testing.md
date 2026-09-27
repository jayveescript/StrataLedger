# Testing

Skeleton paths relative to `templates/skeleton/`.

## Contents
[Unit](#unit) · [Integration](#integration) · [Frontend](#frontend) · [Browser smoke](#smoke) · [What to cover](#coverage)

<a id="unit"></a>
## Backend unit tests (`backend/tests/MyApp.UnitTests`)

- Domain rules (role/permission maps, invitation policy, entity invariants).
- `PipelineTests`: build a real `ServiceCollection` with `AddApplication()`, substitute `ICurrentUser`,
  `IFeatureService`, `IUnitOfWork` (NSubstitute), dispatch test requests and assert 401 → 403 → 402 → validation →
  success + `SaveChangesAsync` once. This proves the behavior order.
- Pure infrastructure helpers (billing math, CSV parser incl. formula injection, image sniffer, token hashing).
- Don't use FluentAssertions (commercial license since v8) — plain xUnit `Assert`.

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
## Browser smoke test (Playwright)

Run API + Vite, then script the real flow with Playwright (`executablePath` to a local Chromium if downloads are
blocked). Generate TOTP codes in Node with `crypto.createHmac('sha1', …)` to enroll/verify MFA through the UI. Take
screenshots and look at them. This is what caught: over-allocation logic, theme not updating after save, a success
message wiped by a remount.

<a id="coverage"></a>
## Must-have integration cases for any project on this architecture

Unauthenticated → 401 ProblemDetails · security headers present · staff must enroll MFA before tokens · TOTP replay
rejected · lockout after N failures · unknown email vs wrong password indistinguishable · refresh rotation and
family revocation on replay · refresh requires CSRF header · password change revokes access tokens and blocks reuse ·
other tenant's data invisible (list + by id 404 + `?tenantId` 403) · RLS returns 0 rows unscoped · end-customer
role blocked from staff endpoints · tier limit 402 · feature outside tier 402 until granted · revoking a feature
blocks immediately · suspension kills sessions · invitation preview has no side effects · invitation single-use ·
weak/personal passwords rejected · login spam → 429.
