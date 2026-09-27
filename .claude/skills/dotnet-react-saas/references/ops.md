# Ops: containers, CI, production

Skeleton paths relative to `templates/skeleton/`.

<a id="docker"></a>
## Docker

- `backend/src/MyApp.Api/Dockerfile`: multi-stage SDK build (restore on csproj layer first), runtime
  `mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled` (no shell, non-root `$APP_UID`), `ASPNETCORE_URLS=http://+:8080`,
  server GC. Writable paths must be volumes or `/tmp` (e.g. `Jwt__DevKeyPath=/tmp/keys/jwt.pem`).
- `frontend/Dockerfile`: node build → `nginxinc/nginx-unprivileged` serving `dist/` on 8080.
- `frontend/nginx.conf`: SPA fallback, immutable caching for `/assets/`, reverse proxy `/api/` → `api:8080` with
  `X-Forwarded-*`, edge `limit_req`, CSP and security headers, `client_max_body_size`.
- `docker-compose.yml`: `postgres` (init script creates the NOSUPERUSER/NOBYPASSRLS app role + DB), `redis`
  (AOF), `mailpit` (SMTP sink + UI on 8025), `api`, `web` (only `web` publishes a port). Values from `.env`
  (`.env.example` provided).

<a id="ci"></a>
## CI (`.github/workflows/ci.yml`)

Backend job: setup-dotnet 10 → restore → build Release → `dotnet ef migrations has-pending-model-changes` (fails if
someone forgot a migration) → `dotnet test` (Testcontainers uses the runner's Docker) → upload TRX. Frontend job:
`npm ci` → lint → typecheck → test → build. Path filters + concurrency cancel.

## Configuration reference

| Key | Purpose |
|---|---|
| `ConnectionStrings__Postgres` | app role (non-superuser) |
| `ConnectionStrings__Redis` | rate limits, caches, Data Protection keys (omit → in-memory, single instance only) |
| `Jwt__SigningKeyPath` / `Jwt__SigningKeyPem` | RS256 private key (3072-bit recommended) |
| `Jwt__AccessTokenMinutes`, `Jwt__RefreshTokenDays` | 15 / 14 defaults |
| `App__FrontendBaseUrl`, `App__ApiBaseUrl` | links in emails, CORS origin |
| `Smtp__*` | outbound email (outbox worker retries with backoff, `FOR UPDATE SKIP LOCKED` so multiple instances are safe) |
| `Seed__SuperAdminEmail/Password`, `Seed__DemoData` | first platform admin; demo tenants for dev only |
| `Security__BreachedPasswordCheck` | HIBP check (fails open) |
| `Database__MigrateOnStartup` | apply migrations at boot (set false if you migrate in a pipeline step) |
| `BackgroundJobs__Disabled`, `RateLimiting__Disabled` | tests only |

## Production checklist

- [ ] `ASPNETCORE_ENVIRONMENT=Production`, real signing key mounted, secrets from a secret store
- [ ] Postgres app role without SUPERUSER/BYPASSRLS; backups; migrations applied once per deploy
- [ ] Redis configured when running more than one API instance
- [ ] TLS terminated in front of nginx; HSTS on; API not publicly reachable except via the proxy
- [ ] Real SMTP + SPF/DKIM for the sender domain
- [ ] `/health/live` and `/health/ready` wired to the orchestrator
- [ ] Logs shipped (Serilog console JSON) without PII; alerts on 5xx and 429 spikes
