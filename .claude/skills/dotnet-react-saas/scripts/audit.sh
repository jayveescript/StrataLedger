#!/usr/bin/env bash
# Read-only scan of an existing repo against the dotnet-react-saas patterns. Prints a markdown gap report.
#   usage: audit.sh [repo-root]
# Heuristic (grep-based): a ✅ means "evidence found", not "correctly implemented" — confirm by reading the code.
set -uo pipefail
ROOT="${1:-.}"
cd "$ROOT" || exit 1

has() { grep -rqsE --include="$1" --exclude-dir={node_modules,bin,obj,dist,.git} -e "$2" . ; }
row() { local area="$1" item="$2" ok="$3" hint="$4"; printf '| %s | %s | %s | %s |\n' "$area" "$item" "$([ "$ok" = 1 ] && echo ✅ || echo ❌)" "$([ "$ok" = 1 ] && echo '' || echo "$hint")"; }
check() { if has "$3" "$4"; then row "$1" "$2" 1 "$5"; else row "$1" "$2" 0 "$5"; fi; }

echo "# Architecture audit: $(basename "$(pwd)")"
echo
CS=0; TSX=0
[ -n "$(find . -name "*.csproj" -not -path "*/node_modules/*" | head -1)" ] && CS=1
[ -n "$(find . -name package.json -not -path '*/node_modules/*' | head -1)" ] && TSX=1
echo "Detected: backend .NET=$([ $CS = 1 ] && echo yes || echo no), JS frontend=$([ $TSX = 1 ] && echo yes || echo no)"
echo
echo "| Area | Check | Status | Suggested fix (reference) |"
echo "|---|---|---|---|"

if [ $CS = 1 ]; then
check "API" "Controller-based API ([ApiController])" "*.cs" "\[ApiController\]" "backend-architecture.md#controllers"
check "API" "ProblemDetails / central error mapping" "*.cs" "ProblemDetails|IExceptionHandler" "backend-architecture.md#results"
check "CQRS" "Dispatcher / request handlers" "*.cs" "IRequestHandler<|ICommandHandler<|IQueryHandler<" "backend-architecture.md#cqrs"
check "CQRS" "Pipeline behaviors (validation/auth/transaction)" "*.cs" "IPipelineBehavior<" "backend-architecture.md#behaviors"
check "CQRS" "FluentValidation validators" "*.cs" "AbstractValidator<" "backend-architecture.md#behaviors"
check "Data" "Repository / unit of work abstraction" "*.cs" "interface IRepository<|interface IUnitOfWork" "backend-architecture.md#persistence"
check "Data" "Async EF queries with projections" "*.cs" "ToListAsync\(|FirstOrDefaultAsync\(" "backend-architecture.md#persistence"
check "Tenancy" "Tenant key on entities (ITenantOwned/TenantId)" "*.cs" "ITenantOwned|TenantId|CompanyId|OrganizationId" "multi-tenancy.md"
check "Tenancy" "Global query filters" "*.cs" "HasQueryFilter" "multi-tenancy.md#query-filters"
check "Tenancy" "Postgres row-level security" "*.cs" "ROW LEVEL SECURITY|CREATE POLICY" "multi-tenancy.md#rls"
check "Auth" "JWT bearer authentication" "*.cs" "AddJwtBearer" "security.md#tokens"
check "Auth" "Refresh tokens stored hashed + rotation" "*.cs" "RefreshToken.*Hash|TokenHash" "security.md#refresh-tokens"
check "Auth" "HttpOnly refresh cookie" "*.cs" "HttpOnly = true" "security.md#refresh-tokens"
check "Auth" "TOTP MFA" "*.cs" "AuthenticatorTokenProvider|VerifyTwoFactorTokenAsync" "security.md#mfa"
check "Auth" "Lockout configured" "*.cs" "MaxFailedAccessAttempts" "security.md#passwords"
check "Auth" "Password validators (breach/history)" "*.cs" "IPasswordValidator<" "security.md#passwords"
check "Auth" "Permission/policy-based authorization" "*.cs" "IAuthorizationPolicyProvider|AuthorizationHandler<" "security.md#authorization"
check "Auth" "Session revocation (security stamp check)" "*.cs" "OnTokenValidated|SecurityStamp" "security.md#revocation"
check "Abuse" "Rate limiting" "*.cs" "AddRateLimiter|EnableRateLimiting" "security.md#rate-limiting"
check "Abuse" "Distributed (Redis) limiter/cache" "*.cs" "RedisRateLimit|AddStackExchangeRedisCache" "security.md#rate-limiting"
check "Hardening" "Security headers" "*.cs" "X-Content-Type-Options|XContentTypeOptions" "security.md#headers"
check "Hardening" "Strict CORS with explicit origins" "*.cs" "WithOrigins\(" "security.md#headers"
check "Audit" "Audit trail (SaveChanges interceptor)" "*.cs" "SaveChangesInterceptor|AuditLog" "security.md#audit"
check "SaaS" "Tier / feature gating" "*.cs" "RequiresFeature|FeatureGate|IFeatureService" "monetisation.md"
check "Ops" "Health checks" "*.cs" "MapHealthChecks" "ops.md"
check "Tests" "Integration tests (WebApplicationFactory)" "*.cs" "WebApplicationFactory<" "testing.md#integration"
check "Tests" "Real database in tests (Testcontainers)" "*.cs*" "Testcontainers" "testing.md#integration"
if has "*.cs*" "UseInMemoryDatabase|EntityFrameworkCore.InMemory"; then row "Tests" "No EF in-memory database fakes" 0 "Replace with Testcontainers Postgres (testing.md#pyramid)"; else row "Tests" "No EF in-memory database fakes" 1 ""; fi
check "Tests" "Architecture tests" "*.cs*" "NetArchTest|ArchUnitNET" "testing.md#architecture"
fi

if [ $TSX = 1 ]; then
check "Frontend" "Access token kept out of localStorage" "*.ts*" "tokenStore|let accessToken" "frontend-architecture.md#tokens"
if has "*.ts*" "localStorage\.(setItem|getItem)\([^)]*(token|jwt)"; then row "Frontend" "No tokens in localStorage" 0 "Move to memory + HttpOnly refresh cookie (frontend-architecture.md#tokens)"; else row "Frontend" "No tokens in localStorage" 1 ""; fi
check "Frontend" "Single-flight refresh on 401" "*.ts" "refreshInFlight|refreshPromise" "frontend-architecture.md#http-client"
check "Frontend" "Server-state library (TanStack Query)" "*.ts*" "@tanstack/react-query" "frontend-architecture.md#data"
check "Frontend" "Atomic design folders" "*.ts*" "components/(atoms|molecules|organisms)" "frontend-architecture.md#atomic"
check "Frontend" "Declarative access rules / route guards" "*.ts*" "evaluateAccess|RequireAuth" "frontend-architecture.md#access"
check "Frontend" "Brand tokens via CSS variables" "*.css" "--brand-" "frontend-architecture.md#branding"
check "Frontend" "Forms with schema validation" "*.ts*" "zodResolver|yupResolver" "frontend-architecture.md#forms"
check "Frontend" "Frontend tests" "*.test.ts*" "describe\(|it\(" "testing.md#frontend"
check "Frontend" "Browser E2E tests (Playwright)" "*.ts" "@playwright/test" "testing.md#smoke"
fi

check "Ops" "Container build" "Dockerfile" "FROM " "ops.md#docker"
check "Ops" "CI workflow" "*.yml" "dotnet test|npm test|npm run build" "ops.md#ci"
check "Ops" "E2E tests run in CI" "*.yml" "playwright|npm run e2e" "testing.md#pyramid"
echo
echo "Next: read references/existing-project-audit.md and turn ❌ rows into an ordered, incremental plan."
