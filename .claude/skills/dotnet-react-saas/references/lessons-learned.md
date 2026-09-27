# Lessons learned (real failures from the reference build)

Skim before declaring any task done. Each item: symptom → cause → fix.

## Backend / EF Core
- **`DbUpdateConcurrencyException` when adding a child through a navigation** (e.g. `lot.Ownerships.Add`) → client-
  generated Guid keys make EF assume the entity exists and issue an UPDATE → mark every `Entity.Id`
  `ValueGeneratedNever()` (done globally in `AppDbContext`).
- **RLS "works" locally but protects nothing** → app connected as a superuser/owner with BYPASSRLS → use a
  `NOSUPERUSER NOBYPASSRLS` role and `FORCE ROW LEVEL SECURITY`; assert zero rows unscoped in a test.
- **`IgnoreQueryFilters()` leaked deleted rows** → it removes *all* filters → re-add `!IsDeleted` and the tenant
  predicate explicitly.
- **`DbSet.Find` bypass risk** → implement repository `FindAsync` via `FirstOrDefaultAsync` so filters apply.
- **Failed logins never locked accounts** → the login ran in a transaction that rolled back on failure, undoing
  `AccessFailedAsync` → mark such commands `[NonTransactional]`; write security audit events in a separate scope.
- **Implicit conversion to `Result<IReadOnlyList<T>>` fails** → C# forbids user-defined conversions from interface
  types → `Result<…>.Success(list)`.
- **Password reuse allowed for some users** → history only stored the *new* hash → store the outgoing hash and also
  compare against the current hash.
- **Ownership/allocation over 100%** after an automated link → domain method must allocate only the remaining share
  (`AssignRemainingShare`) — put invariants in the entity, not the handler.
- **FluentValidation `RuleFor(x => new[]{…})` throws at runtime** (no property name) → one `RuleFor` per member via an
  array of expressions.
- **Generated migrations fail analyzers with warnings-as-errors** → `.editorconfig` section marking `**/Migrations/*.cs`
  generated with diagnostics off.
- **EF `using static` clash**: an enum member named like a namespace (`Feature.Items` vs `MyApp.Domain.Items`) → qualify
  the enum member.

## Auth / security
- **Office users locked out by rate limits** → 10/min per IP on auth is too tight behind NAT → 20/min auth, separate
  looser `session` policy for refresh/logout; rely on account lockout for brute force.
- **Two tabs logged each other out** → concurrent refresh with the same rotated token looked like theft → 20 s reuse
  grace + single-flight refresh on the client.
- **Role claims missing** → `JwtSecurityTokenHandler` maps `ClaimTypes.Role` to `role` on write and back on read →
  emit `role` explicitly, empty `OutboundClaimTypeMap`, `MapInboundClaims=false`, `RoleClaimType="role"`.
- **ResetAuthenticatorKey/SetTwoFactorEnabled rotate the security stamp** → current access token becomes invalid →
  the SPA's 401 → refresh path handles it; don't fight it.
- **Template CSV download returned 401** → plain `<a href>` doesn't send the bearer token → generate the file client
  side or fetch with auth and create a blob.

## Frontend
- **Theme didn't update after saving branding** → `me` lives in AuthContext, invalidating a query key did nothing →
  call `reloadMe()` after profile/branding mutations.
- **Success message vanished after save** → component keyed on `JSON.stringify(data)` remounted when data refreshed →
  key on a stable id.
- **Super Admin saw end-customer menu items** → SuperAdmin holds every permission → restrict such nav items by role.
- **`/login` redirect before lazy home route resolved** → tests waiting on URL may see `/` briefly; wait for content.

## Tooling / environment
- **`pkill -f <pattern>` killed the shell running it** → the pattern matched the command line itself → kill by PID.
- **WebApplicationFactory ignored test connection string** → use `builder.UseSetting` so values exist during
  `Program`'s builder phase.
- **Parallel test fixtures raced creating the DB role** → wrap `CREATE ROLE` in `DO … EXCEPTION WHEN duplicate_object
  OR unique_violation`.
- **Sandboxed environments** may block `dot.net` installers (use distro packages, e.g. `apt install dotnet-sdk-10.0`),
  Docker daemons (point tests at a local Postgres via the env var) and third-party APIs like HIBP (fail open).
- **Heavy `sed` renames** broke string literals containing `\n` in replacement text and produced duplicate
  dictionary keys → re-build and grep after bulk edits.
