# MyApp

Multi-tenant SaaS skeleton: ASP.NET Core 10 controller API (Clean Architecture, CQRS, EF Core/PostgreSQL, RLS, JWT +
refresh cookie, TOTP MFA, tiers/features, Redis rate limiting) and a React 19 + Vite atomic-design SPA with
per-tenant branding. Generated from the `dotnet-react-saas` skill.

## Run

```bash
cp .env.example .env && docker compose up --build        # http://localhost:8080 · mail UI http://localhost:8025
# or locally
cd backend && dotnet tool restore && dotnet run --project src/MyApp.Api     # needs Postgres (see appsettings.Development.json)
cd frontend && npm install && npm run dev                                   # http://localhost:5173
```

Demo data (Development): super admin from config, tenant `admin@acme.test` / `manager@acme.test` /
`member@acme.test` (same password as the super admin). Staff enroll an authenticator app on first sign-in.

## Test

```bash
cd backend && MYAPP_TEST_PG_ADMIN="Host=localhost;Username=postgres;Password=postgres" dotnet test   # or Docker for Testcontainers
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

## Extend

`Items` is the example module (domain → application slice → controller → API hooks → page). Copy it for each real
module, add the table to the RLS migration list, and regenerate migrations:
`dotnet ef migrations add <Name> -p src/MyApp.Infrastructure -s src/MyApp.Infrastructure -o Persistence/Migrations`.
