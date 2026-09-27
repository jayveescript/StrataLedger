# Multi-tenancy (shared database, tenant key, defence in depth)

Skeleton paths are relative to `templates/skeleton/backend/src/`.

## Contents
[Model](#model) · [Query filters](#query-filters) · [TenantContext](#tenant-context) · [RLS](#rls) ·
[Resolving the target tenant](#resolve) · [Platform scope](#platform) · [Checklist](#checklist)

<a id="model"></a>
## Model

- Every user belongs to exactly one tenant (`ApplicationUser.TenantId`), except platform `SuperAdmin` (null). Sole
  traders are single-user tenants; there is no public sign-up — Super Admin creates tenants, then invites.
- Tenant-owned rows implement `ITenantOwned` (`Guid TenantId`); most derive `TenantEntity`
  (`MyApp.Domain/Common/Contracts.cs`) which adds audit stamps and soft delete.
- Tenant table itself (`Tenant`), tiers, users and audit logs are *not* RLS-protected: they are read before a tenant
  is known (login, invitation lookup) and are filtered in code.

<a id="query-filters"></a>
## Layer 1 — EF global query filters

`MyApp.Infrastructure/Persistence/AppDbContext.cs` builds, by reflection over the model, two **named** filters
(EF 10) for every entity:

- `Tenant`: `e => BypassTenantFilter || e.TenantId == CurrentTenantId`
- `SoftDelete`: `e => !e.IsDeleted`

`CurrentTenantId`/`BypassTenantFilter` are properties on the context that read `ITenantContext`; EF parameterises
members of the context instance, so the cached model still evaluates per query. `IgnoreQueryFilters()` removes both
filters — always re-add `TenantId == x && !IsDeleted` when you use it (usage counters, invitation lookup by token).

<a id="tenant-context"></a>
## TenantContext

`MyApp.Infrastructure/Tenancy/TenantContext.cs` (scoped):

- Defaults from the JWT: `TenantId` claim; `IsPlatformScope` when the role is SuperAdmin.
- `EnterTenantScopeAsync(id)` — for anonymous flows that must touch tenant rows after identifying the tenant
  (invitation acceptance). `EnterPlatformScopeAsync()` — background workers, seeding, the audit writer.
- Switching scope re-applies the Postgres session settings if the connection is already open (inside a transaction),
  via `TenantSessionSql.CreateCommand`.

<a id="rls"></a>
## Layer 2 — Postgres row-level security

- `TenantConnectionInterceptor` runs on every `ConnectionOpened`:
  `SELECT set_config('app.tenant_id', @tenant, false), set_config('app.bypass_rls', @bypass, false)`.
  Npgsql resets session state when pooled connections are reused, and we set both values on every open anyway.
- Migration `RowLevelSecurity` (copy for every new tenant table):

```sql
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items FORCE ROW LEVEL SECURITY;          -- applies to the table owner too
CREATE POLICY tenant_isolation ON items
  USING      (current_setting('app.bypass_rls', true) = 'on'
              OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (current_setting('app.bypass_rls', true) = 'on'
              OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- **The application role must be `NOSUPERUSER NOBYPASSRLS`.** Superusers bypass RLS silently. `deploy/postgres-init.sh`
  creates such a role for Docker; integration tests create one too (`tests/.../ApiFactory.cs`).
- Unscoped connection (no tenant, no bypass) sees zero rows — that is the safe default and is asserted by
  `Row_level_security_blocks_queries_without_a_tenant`.

<a id="resolve"></a>
## Resolving the target tenant for a request

`ICurrentUser.ResolveTenant(Guid? requested)` (`MyApp.Application/Common/Services/ICurrentUser.cs`) is a tuple
switch:

| Caller | requested | Result |
|---|---|---|
| SuperAdmin | id | that id |
| SuperAdmin | null | 400 "tenant required" |
| tenant user | null | own tenant |
| tenant user | own id | own tenant |
| tenant user | other id | 403 |

Use it in every command/query that accepts an optional `TenantId` (creates, tenant settings, usage, invitations,
users). Reads by entity id need nothing extra — the filters + RLS make other tenants' ids return 404.

<a id="platform"></a>
## Platform (Super Admin) scope

Super Admin bypasses tenant filters and feature gates but still passes role/permission checks. Platform endpoints
live under `/api/v1/platform/*` with `[Authorize(Roles = Roles.SuperAdmin)]`. Force sign-out bumps
`Tenant.SessionVersion` (a JWT claim) and revokes refresh tokens; suspension does the same and blocks sign-in.

<a id="checklist"></a>
## Checklist for a new tenant table

- [ ] Entity derives `TenantEntity` (or implements `ITenantOwned` + `ISoftDeletable` as needed)
- [ ] Index on `(tenant_id, …)`; unique indexes filtered on `is_deleted = false`
- [ ] FK to tenant with `DeleteBehavior.Restrict`
- [ ] Migration enabling RLS + policy for the table
- [ ] Integration test: other tenant's id → 404; `?tenantId=<other>` → 403
