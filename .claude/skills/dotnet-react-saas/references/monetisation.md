# Monetisation: tiers, features, limits

Skeleton paths relative to `templates/skeleton/`.

## Model

- `Feature` enum = sellable modules (`backend/src/MyApp.Domain/Enums/Feature.cs`).
- `TierDefinition` rows (seeded from `TierCatalog`, editable by Super Admin at **Pricing tiers**): name, monthly
  price, `Features[]`, `MaxItems` (null = unlimited — rename per product, e.g. MaxProjects), `StorageQuotaMb`,
  `IncludedSeats`, `PerSeatOverageCents`.
- `TenantFeatureOverride` (per tenant, optional expiry + note): grant a feature outside the tier (trial, deal) or
  revoke one inside it (billing hold).
- Effective features = tier features ∪ active grants − active revocations, computed by `FeatureService` and cached
  in Redis for 5 min; every change calls `InvalidateAsync(tenantId)`.

## Enforcement

| Situation | Where | Result |
|---|---|---|
| Module not in plan | `[FeatureGate]` on controller + `[RequiresFeature]` on request | **402** `feature.disabled` with `feature` field |
| Hard limit (e.g. max items, storage) | `UsageLimits.EnsureCan…` inside the command | **402** `limit.<name>` |
| Soft limit (seats beyond included) | not blocked | billed as overage in `UsageDto.Pricing` |
| Super Admin | bypasses feature checks | — |

`IBillingProvider.Calculate(base, included, perUnit, count)` returns the estimate (`ManualBillingProvider` for
manual invoicing). Add a Stripe implementation behind the same interface later: subscription tier ↔ `Tenant.Tier`
via webhooks, overage as metered usage.

## UI

- `/me` returns `features[]`; `evaluateAccess` yields `locked` when role/permission allow but the feature is
  missing → sidebar shows a lock icon, route guard renders `FeatureLockNotice`, API 402s render the same notice via
  `QueryState`.
- Super Admin screens: tenant detail → *Feature access* matrix (tier default, override, effective, grant/revoke,
  "use tier"), *Overview* (tier, status, usage & estimated bill), and the tier price-book editor.

## Adding a paid module

1. Add `Feature.X`, include it in the right tiers in `TierCatalog` (existing DBs: update tiers via the UI or a data
   migration — the seeder only inserts missing tiers).
2. Gate controller + requests; add nav item with `feature: 'X'` and route guard.
3. If it has a quantity limit, add fields to `TierDefinition` + `UsageLimits` + `UsageDto` + tier editor.
4. Integration test: tier without it → 402; Super Admin grant → 200.
