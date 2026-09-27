# Backend architecture

Skeleton root: `templates/skeleton/backend/` (paths below are relative to it).

## Contents
- [Solution layout](#layout) · [CQRS](#cqrs) · [Behaviors](#behaviors) · [Results](#results)
- [Persistence](#persistence) · [Controllers](#controllers) · [Feature slice recipe](#recipe) · [Style rules](#style)

<a id="layout"></a>
## Solution layout (Clean Architecture, dependencies point inward)

| Project | Holds | Must not reference |
|---|---|---|
| `MyApp.Domain` | Entities (private setters, factory + behaviour methods), enums, `RolePermissions`, `InvitationPolicy`, `TierCatalog`, `Roles` constants | EF, ASP.NET |
| `MyApp.Application` | Requests + handlers per feature (`Features/<Module>/<Module>.cs`), validators, service interfaces (`Common/Services`), dispatcher + behaviors, `Result<T>` | Infrastructure, Api |
| `MyApp.Infrastructure` | `AppDbContext`, configurations, migrations, `Repository<T>`, interceptors, Identity/JWT/sessions, Redis, email outbox, parsers, seeding, `DependencyInjection.AddInfrastructure` | Api |
| `MyApp.Api` | Controllers, auth setup, policy provider, rate limiting, security headers, exception handler, `Program.cs` | — |

Pragmatic exceptions (deliberate): Application references `Microsoft.EntityFrameworkCore` (for LINQ async over
`IQueryable` from repositories) and `Microsoft.Extensions.Identity.Core` (`UserManager`). Domain references
`Microsoft.Extensions.Identity.Stores` only for `IdentityUser<Guid>`.

`Directory.Build.props`: `net10.0`, nullable, `TreatWarningsAsErrors`, `AnalysisLevel latest-recommended` with a
curated `NoWarn`. `tests/Directory.Build.props` relaxes naming/test-double analyzers. `.editorconfig` marks
`Migrations/` as generated.

<a id="cqrs"></a>
## CQRS

Files: `src/MyApp.Application/Common/Messaging/{Contracts,Dispatcher}.cs`, `Common/Results/*`.

- `IRequest<TResult>` → handler returns `Task<Result<TResult>>`. `ICommand<T>` (writes, transactional) and
  `IQuery<T>` (reads) are markers. Use `Unit` for "no payload".
- `Dispatcher.Send` builds a closed generic invoker once per request type (cached in a `ConcurrentDictionary`),
  resolves the handler and all `IPipelineBehavior<TRequest,TResult>` and chains them.
- Handlers and validators are registered by assembly scan in `Application/DependencyInjection.cs`; register shared
  application services (e.g. `SignInFlow`, `UsageLimits`, `InvitationService`) there too.
- Requests are `record`s. List queries inherit `PageRequest(Page, PageSize)` (clamped to 1..100) and return
  `PagedResult<T>` via `ToPagedResultAsync`.

<a id="behaviors"></a>
## Pipeline behaviors (registration order = execution order)

1. `LoggingBehavior` — source-generated `LoggerMessage`, elapsed ms, error code on failure.
2. `AuthorizationBehavior` — reads `[AllowAnonymousRequest]`, `[RequiresPermission]`, `[RequiresFeature]` once per
   request type (static readonly fields in the generic class). Unauthenticated → `Unauthorized`; missing permission →
   `Forbidden`; missing plan feature → `FeatureDisabled` (Super Admin bypasses features).
3. `ValidationBehavior` — all FluentValidation validators for the request; field errors grouped into
   `Error.Details`. Shared field rules live in an abstract record (`ItemFields`) + validator reused via `Include`.
4. `TransactionBehavior` (constrained to `ICommand<T>`) — `IUnitOfWork.ExecuteInTransactionAsync`; `SaveChanges`
   only on success, rollback + `ChangeTracker.Clear()` on failure. Opt out with `[NonTransactional]` for commands
   that must persist state even when they return failure (e.g. login counting failed attempts).

<a id="results"></a>
## Results and HTTP mapping

`Error(ErrorType, Code, Message, Details?)` with factories (`Validation`, `NotFound`, `Conflict`, `LimitReached`,
`FeatureDisabled`, ...). `Result<T>` has implicit conversions from `T` and `Error` — note C# forbids user-defined
conversions from interface types, so return `Result<IReadOnlyList<X>>.Success(list)` explicitly when `T` is an
interface. `ApiControllerBase.ToProblem` maps via a frozen dictionary:

| ErrorType | HTTP |
|---|---|
| Validation | 400 (with `errors` field map) |
| Unauthorized | 401 |
| Forbidden | 403 |
| NotFound | 404 (also used for other-tenant ids — don't leak existence) |
| Conflict | 409 |
| LimitReached / FeatureDisabled | 402 |
| TooManyRequests | 429 |

Unexpected exceptions go to `GlobalExceptionHandler` (unique violation → 409, bad upload → 400, else 500 without
internals). Every problem includes `code` and `traceId`.

<a id="persistence"></a>
## Persistence

Files: `Infrastructure/Persistence/{AppDbContext,Repository}.cs`, `Interceptors/*`, `Configurations/*`.

- `IRepository<T>`: `Query()` (no-tracking, for LINQ projections with `Select` to DTOs), `QueryTracked()` (aggregates
  you will modify), `FindAsync(id)` implemented with `FirstOrDefaultAsync` so query filters always apply (not
  `DbSet.Find`), `Add/AddRange/Remove`.
- `AppDbContext` implements `IUnitOfWork`; `ExecuteInTransactionAsync` uses the execution strategy and is re-entrant.
- Snake-case naming (`EFCore.NamingConventions`), Guid v7 ids created in the domain, `ValueGeneratedNever()` applied
  to every `Entity.Id` so children added via navigations are INSERTed.
- `AuditingInterceptor`: stamps `CreatedAt/By`, `UpdatedAt/By`; converts deletes of `ISoftDeletable` into flags;
  writes an `AuditLog` row with a property diff (sensitive props excluded) in the same transaction.
- Complex/owned value objects (e.g. `BrandSettings`) map with `ComplexProperty(...).ToJson()` (jsonb); replace the
  whole value object to update it.
- Use `IgnoreQueryFilters()` only with an explicit `TenantId == x && !IsDeleted` predicate (it drops both filters).

<a id="controllers"></a>
## Controllers

Reference: `src/MyApp.Api/Controllers/ItemsController.cs`, `Infrastructure/ApiControllerBase.cs`.

```csharp
[Route("api/v1/items")]
[Authorize(Roles = $"{Roles.TenantStaff},{Roles.SuperAdmin}")]   // coarse role gate
[FeatureGate(Feature.Items)]                                     // plan feature → 402 when missing
public sealed class ItemsController : ApiControllerBase
{
    [HttpGet, HasPermission(Permission.ItemsRead)]
    public Task<IActionResult> List([FromQuery] ListItemsQuery query) => Send(query);

    [HttpPut("{id:guid}"), HasPermission(Permission.ItemsWrite)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateItemCommand command) => SendNoContent(command with { Id = id });
}
```

- Traditional controllers only (no minimal APIs), versioned routes `api/v1/...`, JSON enums as strings.
- Route ids override body ids (`command with { Id = id }`). Tenant-scoped endpoints accept optional `?tenantId=` so
  Super Admin can act on any tenant; the handler's `ResolveTenant` enforces who may.
- `Send`, `SendNoContent`, `SendCreated(request, location)`; auth endpoints use custom `onSuccess` to set cookies.
- `HasPermission`/`FeatureGate` are `AuthorizeAttribute` subclasses resolved by `DynamicPolicyProvider`
  (`perm:X` / `feat:X`); `ProblemAuthorizationResultHandler` returns ProblemDetails and 402 for feature failures.
- Fallback policy requires authentication; mark public endpoints `[AllowAnonymous]` explicitly.

<a id="recipe"></a>
## Feature slice recipe (add a module end to end)

1. **Domain**: `Domain/<Module>/<Entity>.cs` deriving `TenantEntity` (tenant key, audit stamps, soft delete) with a
   static `Create(...)` and behaviour methods; enums next to it. Add `Permission` values (`XRead`, `XWrite`), a
   `Feature` value if sellable, map permissions in `RolePermissions`, add the feature to tiers in `TierCatalog`.
2. **Infrastructure**: `DbSet`, `IEntityTypeConfiguration` (lengths, precision, indexes incl. `(TenantId, …)`,
   filtered unique indexes `HasFilter("is_deleted = false")`, FK to tenant `Restrict`). Migration +
   a follow-up migration enabling RLS on the new table (copy `RowLevelSecurity`).
3. **Application**: `Features/<Module>/<Module>.cs` modelled on `Features/Items/Items.cs` — DTO records, requests with
   attributes, validators, handlers. Creates call `currentUser.ResolveTenant(request.TenantId)` and any
   `UsageLimits.EnsureCan…` check.
4. **Api**: controller modelled on `ItemsController`.
5. **Tests**: unit tests for domain rules; integration tests for happy path, other-tenant id → 404, wrong role → 403,
   feature off → 402, limit → 402.
6. **Frontend**: see `frontend-architecture.md` recipe.

<a id="style"></a>
## Style rules

- `sealed` classes/records, primary constructors for DI, `CancellationToken` passed end to end.
- Early `return error;` guards are fine; avoid nested if/else — use lookup tables or tuple `switch` expressions
  (see `SignInFlow.ContinueAfterPasswordAsync`, `TenantUserAccess.FindManageableAsync`).
- Source-generated logging (`[LoggerMessage]`), no string interpolation in log calls.
- Comments explain *why* (security reasoning, invariants), not what.
