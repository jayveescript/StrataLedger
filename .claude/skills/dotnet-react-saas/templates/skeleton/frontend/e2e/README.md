# Browser E2E tests (Playwright)

Run against the real stack: API + PostgreSQL with Development seed data, SPA production build via `vite preview`.

```bash
# 1. API (fresh database so seeded staff still need MFA enrollment)
cd backend && ASPNETCORE_ENVIRONMENT=Development Security__BreachedPasswordCheck=false \
  dotnet run --project src/MyApp.Api --launch-profile http
# 2. Tests (builds and serves the SPA on :4173, proxying /api to :5080)
cd frontend && npx playwright install chromium && npm run e2e
```

Set `PLAYWRIGHT_CHROMIUM_PATH` to use a preinstalled Chromium. CI runs this in the `e2e` job of `.github/workflows/ci.yml`.
