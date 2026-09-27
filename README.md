# StrataLedger

Multi-tenant strata management SaaS for Australian owners corporations.

```
├── backend/    ASP.NET Core 10 Web API  (Clean Architecture · CQRS · EF Core/PostgreSQL · JWT)
├── frontend/   React 19 + Vite SPA     (Atomic design · TanStack Query · Tailwind v4 · white-label)
├── deploy/     Container helpers (Postgres app role)
├── app/        Previous Next.js prototype — UI reference until feature parity, then removed
└── demo/       Static demo (GitHub Pages)
```

## Quick start

### Docker (everything)

```bash
cp .env.example .env          # change the secrets
docker compose up --build
```

On Windows, if Postgres logs `/bin/sh^M: bad interpreter`, your checkout predates `.gitattributes`: convert
`deploy/postgres-init.sh` to LF (or `git rm --cached -r . && git reset --hard`), then `docker compose down -v` and
start again. Postgres only creates the app role on an empty volume, so also run `down -v` after changing `.env` passwords.

- App: http://localhost:8080 · Email inbox (Mailpit): http://localhost:8025
- Sign in as the Super Admin from `.env`. With `SEED_DEMO_DATA=true` you also get demo tenants from the prototype
  (`admin@premierstrata.com.au`, `manager@premierstrata.com.au`, owner `james.chen@email.com`, all using the
  Super Admin password). Staff accounts are asked to enrol an authenticator app on first sign-in.

### Local development

```bash
# API  (needs PostgreSQL; Redis optional — falls back to in-memory cache/rate limits)
cd backend
dotnet run --project src/StrataLedger.Api          # http://localhost:5080, API reference at /scalar

# SPA
cd frontend
npm install && npm run dev                          # http://localhost:5173, proxies /api to :5080
```

`appsettings.Development.json` expects `Host=localhost;Database=strataledger;Username=strataledger;Password=strataledger`.
The app role must **not** be a superuser (superusers bypass row-level security).

## Architecture

### Backend (`backend/`)

| Project | Responsibility |
|---|---|
| `StrataLedger.Domain` | Entities, enums, role→permission map, invitation policy, tier catalog. No infrastructure. |
| `StrataLedger.Application` | Commands/queries + handlers (vertical slices under `Features/`), validators, service interfaces, CQRS dispatcher and pipeline behaviors. |
| `StrataLedger.Infrastructure` | EF Core `AppDbContext`, repositories, migrations (incl. RLS), Identity, JWT/refresh sessions, Redis, email outbox, file parsing, seeding. |
| `StrataLedger.Api` | Traditional controllers, authorization policies, rate limiting, security headers, ProblemDetails. |

**Request flow** — `Controller → IDispatcher.Send(request) → Logging → Authorization → Validation → Transaction → Handler → IRepository<T>/LINQ`.
Controllers contain no logic: each action builds a command/query and returns `Send(...)`. Handlers return `Result<T>`;
one lookup table in `ApiControllerBase` maps error types to HTTP status codes (400/401/402/403/404/409/429).

**Authorization is enforced twice**: controller attributes (`[Authorize(Roles = …)]`, `[HasPermission(…)]`,
`[FeatureGate(…)]`) and request attributes (`[RequiresPermission]`, `[RequiresFeature]`) checked in the pipeline.
Anything not explicitly anonymous requires an authenticated user.

**Tenancy** — every tenant row carries `CompanyId`. EF global query filters scope all queries to the caller's company,
and Postgres row-level security (`FORCE ROW LEVEL SECURITY`) enforces the same rule in the database using a per-connection
`app.company_id` setting. Super Admin runs in platform scope.

### Security

- Passwords: ≥12 chars with upper/lower/digit/symbol, 5+ unique chars, no name/email, not in known breaches
  (HIBP k-anonymity, fail-open), no reuse of current + last 5. PBKDF2 with 600k iterations. Lockout after 5 failures for 15 min.
- MFA: TOTP (authenticator apps) mandatory for all staff and Super Admin, optional for owners; one-time recovery codes;
  codes cannot be replayed.
- Tokens: RS256 access tokens (15 min) kept in SPA memory only; rotating refresh tokens in an `HttpOnly; Secure;
  SameSite=Strict` cookie scoped to `/api/v1/auth`, stored hashed, with family-wide revocation on reuse (theft detection)
  and a CSRF header on refresh.
- Instant revocation: password/role/status changes rotate the security stamp; Super Admin can force-sign-out a whole
  company or suspend it. Every request re-validates against a short Redis cache.
- Anti-abuse: Redis sliding-window rate limits (per IP on auth, per user globally, stricter on bulk uploads) plus an
  nginx edge limit; uniform login errors and timing to prevent account enumeration.
- Full audit log of data changes (property diffs) and security events, visible to company admins and Super Admin.
- Uploads: size limits, magic-byte sniffing (no SVG), CSV-injection neutralisation.

### Monetisation

Tiers (`Starter`, `Professional`, `Enterprise`) define the enabled features, max strata plans, storage quota, included
owners and the per-owner overage price. Super Admin edits the price book under **Pricing tiers** and can grant or revoke
individual features per company (optionally time-limited) under **Companies → Feature access**. A feature missing from
a company's plan returns `402` and the SPA shows an upgrade notice / lock icon. Billing is manual for now behind
`IBillingProvider` (Stripe can be plugged in later).

### Onboarding

Super Admin creates a company (even a sole trader is a company), then uploads an email list (CSV/XLSX: `email,
first_name, last_name, role[, plan_number, lot_number]`). Rows are validated (roles the uploader may grant, duplicates,
existing users, plan/lot references, plan features) before sending single-use, 72-hour invitation emails branded with the
company's logo and colours. Company Admins (and Strata Managers, for owners) can do the same for their own company.

### Frontend (`frontend/src`)

```
api/          fetch client (bearer from memory, single-flight refresh on 401), typed endpoints + TanStack Query hooks
auth/         token store, AuthProvider (silent sign-in), access rules, sign-in flow state machine
brand/        brand tokens → CSS variables (per-company white-label), BrandProvider with live preview override
components/
  atoms/      Button, Input, Select, Badge, Card, Logo, Spinner, …
  molecules/  FormField, Dialog, Pagination, PasswordStrengthMeter, OtpInput, FileDropzone, QueryState, Tabs, …
  organisms/  Sidebar, DataTable, LoginForm, MfaEnrollment, InviteUploadWizard, BrandingEditor, FeatureMatrix, …
  templates/  AppLayout, AuthLayout
pages/        route screens (lazy-loaded)
lib/          navigation config (data-driven menu), formatting, password policy
```

Navigation and route guards are driven by one access rule shape (`roles`, `permission`, `feature`), producing
`allowed`, `forbidden` or `locked` (upsell) states.

## Testing

Every kind of test runs in GitHub Actions (`.github/workflows/ci.yml`) on each PR:

| Suite | Where | What |
|---|---|---|
| Unit | `backend/tests/StrataLedger.UnitTests` | domain rules, CQRS pipeline order, parsers, billing |
| Architecture | `backend/tests/StrataLedger.ArchitectureTests` | layer boundaries, thin controllers, every request authorized, every tenant table under RLS |
| Integration | `backend/tests/StrataLedger.IntegrationTests` | real API + **real PostgreSQL via Testcontainers** (no EF in-memory fakes): tenant isolation + RLS, MFA, lockout, refresh-token theft detection, tier limits, invitations, rate limiting |
| Frontend unit | `frontend/src/**/*.test.ts(x)` | Vitest + Testing Library |
| Browser E2E | `frontend/e2e` | Playwright against the running API + Postgres: sign-in incl. MFA enrollment, RBAC, reload persistence, branding, super admin |

```bash
cd backend && dotnet test          # Docker for Testcontainers, or STRATALEDGER_TEST_PG_ADMIN=<admin connection string>
cd frontend && npm test            # Vitest
cd frontend && npm run e2e         # Playwright; start the API on a fresh database first (see frontend/e2e/README.md)
```

## Production checklist

- `ASPNETCORE_ENVIRONMENT=Production`, `Jwt__SigningKeyPath` (or `Jwt__SigningKeyPem`) pointing at a 3072-bit RSA key.
- `ConnectionStrings__Postgres` for a non-superuser role without `BYPASSRLS`; `ConnectionStrings__Redis` for shared
  rate limits, caches and Data Protection keys across instances.
- Real SMTP settings (`Smtp__*`), `App__FrontendBaseUrl` / `App__ApiBaseUrl` set to your public origin.
- Serve behind TLS (the nginx container expects a TLS-terminating load balancer in front).

## Roadmap

Milestone 1 (this): platform foundation, companies/tiers/features, invitations, branding, audit, strata plans, lots,
owners, owner portal. Next: levies & payments, expenses/suppliers/reports, the 3-layer rules engine (ported from
`app/lib/rules`), AGM & voting, complaints, capital works, Stripe billing.
