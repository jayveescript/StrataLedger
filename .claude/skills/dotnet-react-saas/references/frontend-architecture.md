# Frontend architecture (React 19 + Vite + TypeScript)

Skeleton root: `templates/skeleton/frontend/src/`.

## Contents
[Stack](#stack) · [Folders](#atomic) · [HTTP client](#http-client) · [Tokens](#tokens) · [Auth flow](#auth) ·
[Access rules](#access) · [Data](#data) · [Branding](#branding) · [Forms](#forms) · [Routing](#routing) ·
[Feature recipe](#recipe) · [Lint rules](#lint)

<a id="stack"></a>
## Stack

TypeScript strict (+ `noUncheckedIndexedAccess`), Vite with `@/` alias and `/api` proxy, Tailwind v4 (CSS-first
theme), Radix primitives (Dialog, Slot), class-variance-authority, TanStack Query, React Router (data router, lazy
routes), React Hook Form + Zod (`@hookform/resolvers`), lucide-react, qrcode.react, Vitest + Testing Library,
oxlint. No enums in TS (`erasableSyntaxOnly`): use string unions mirroring the API's string enums.

<a id="atomic"></a>
## Folder map (atomic design)

```
api/          http.ts (client), types.ts (DTOs), queryKeys.ts, one module per domain with query/mutation hooks
auth/         tokenStore, AuthContext (+ authContextValue, useAuth), access.ts, useSignInFlow
brand/        brandTokens (DTO→CSS var map, applyBranding), BrandContext (+ value, useBrand)
components/
  atoms/      no app knowledge: Button(+buttonVariants), Input, Select, Checkbox, Textarea, Label, Badge, Card, Logo,
              Avatar, Spinner, ProgressBar, Skeleton
  molecules/  small compositions: FormField, Dialog, ConfirmDialog, Alert, Pagination, SearchInput, StatCard,
              StatusBadge, QueryState, FeatureLockNotice, PasswordStrengthMeter, OtpInput, FileDropzone, Tabs, …
  organisms/  feature blocks that may call hooks: DataTable, Sidebar, TopBar, LoginForm, MfaEnrollment,
              InviteUploadWizard, BrandingEditor, FeatureMatrix, UsageSummary, SessionList, *FormDialog
  templates/  AppLayout (sidebar + topbar + Outlet), AuthLayout
pages/        route screens only compose organisms; lazy-loaded
lib/          navigation.ts (menu as data), format.ts, passwordPolicy.ts, apiErrors.ts, cn.ts
app/          App.tsx (providers), router.tsx, RequireAuth.tsx
```

Rules: atoms/molecules never import `api/`; each folder has an `index.ts` barrel; files that export components
export only components (fast refresh) — contexts, hooks and cva variants live in separate files.

<a id="http-client"></a>
## HTTP client (`api/http.ts`)

- Base `/api/v1`, `credentials: 'same-origin'`, attaches `Authorization: Bearer <memory token>`.
- On 401: **single-flight** `refreshAccessToken()` (all concurrent 401s await one refresh, because the refresh token
  rotates) then retries once; if refresh fails → session-expired handler clears auth.
- Errors become `ApiError { status, code, fieldErrors, feature, isFeatureLocked }` from ProblemDetails.
- Query client default: no retry for 4xx, one retry for 5xx, `refetchOnWindowFocus: false`, 30 s stale.

<a id="tokens"></a>
## Tokens

`auth/tokenStore.ts` holds the access token in a module variable with subscribers — never storage. Page reload →
`AuthProvider` calls `/auth/refresh` (cookie) → `/auth/me`. StrictMode's double effect is harmless because refresh is
single-flight.

<a id="auth"></a>
## Sign-in flow

`useSignInFlow` is a small state machine: `credentials → mfa | enroll → recovery-codes → app`. The API's `step`
selects the next state through a lookup object. Pages: Login (all steps), AcceptInvite (branded with the inviting
tenant via `setOverride`, then enrollment for staff), Forgot/Reset password, Account (profile, change password,
MFA setup, sessions). After profile/branding changes call `reloadMe()` — `me` lives in AuthContext, not the query
cache, so invalidating a query key does nothing.

<a id="access"></a>
## Access rules (`auth/access.ts`)

```ts
interface AccessRule { roles?: UserRole[]; permission?: Permission; feature?: Feature }
evaluateAccess(me, rule): 'allowed' | 'forbidden' | 'locked'
```

Used by: `lib/navigation.ts` (menu items are data; forbidden hidden, locked shows a lock), `RequireAuth` route
guard (renders page / Forbidden / FeatureLockNotice via a lookup), and buttons (`useAccess({ permission }) === 'allowed'`).
`homePathFor(role)` picks the landing page.

<a id="data"></a>
## Data fetching

One module per domain (`api/items.ts` is the reference): `useX(query)` with `placeholderData: keepPreviousData`
for paging, mutations that invalidate the domain prefix. `qk` factory centralises keys. Pages render through
`<QueryState query={…}>{data => …}</QueryState>` which handles loading, errors and 402 locks uniformly.

<a id="branding"></a>
## White-label branding

- `index.css` defines `--brand-*` variables (defaults) and maps them into Tailwind theme colours (`bg-primary`,
  `text-ink`, `border-line`, …). Components use only these semantic classes — never raw hex.
- `BRAND_CSS_VARS` maps each `Branding` DTO field to a variable; `applyBranding` writes them to `:root`, sets
  `document.title` and a monogram/logo favicon.
- `BrandProvider` resolves `override ?? me.branding ?? DEFAULT_BRANDING`. Overrides: invitation page (pre-login
  tenant branding) and the branding editor's live preview.
- Logos: PNG/JPEG/WebP only, served from a public, cacheable endpoint so emails can use them.

<a id="forms"></a>
## Forms

React Hook Form + Zod schema mirroring the server validator; `z.coerce.number<string>()` for numeric inputs with
`useForm<Input, unknown, Output>`. `applyServerErrors(error, setError, fields)` maps API field errors onto inputs and
returns a general message for an `<Alert>`. Use `useWatch` (not `watch()`) for derived UI. Reset form state in an
effect keyed on `open`; clear submit errors at the start of submit (not in the effect).

<a id="routing"></a>
## Routing

`createBrowserRouter` with nested guards: `RedirectIfAuthenticated` (login pages), `RequireAuth` (signed in), then
per-area `RequireAuth roles/permission/feature`. Pages load through a `page(() => import(...), 'Name')` helper
(`lazy` route property) so each screen is its own chunk.

<a id="recipe"></a>
## Feature recipe (frontend half)

1. Types in `api/types.ts`; hooks in `api/<module>.ts` (copy `items.ts`); keys in `queryKeys.ts`.
2. Organisms: `<Module>FormDialog` (copy `ItemFormDialog`), any tables via `DataTable` column config.
3. Page in `pages/<module>/` (copy `ItemsPage`): `PageHeader`, `SearchInput`, `QueryState`, `DataTable`,
   `Pagination`, permission-aware actions, `ConfirmDialog` for deletes.
4. Route with guard in `router.tsx`; nav item with the same rule in `lib/navigation.ts`.
5. Tests: access rules, component behaviour; smoke the flow in a browser.

<a id="lint"></a>
## Lint rules the code must satisfy (oxlint React compiler rules)

- `only-export-components`: split contexts/hooks/variants out of component files.
- `set-state-in-effect`: don't `setState` synchronously in effects; derive, key, or set in event handlers.
- `incompatible-library`: prefer `useWatch` over RHF `watch()`.
- Avoid keying a component on data that changes after save (it remounts and wipes mutation state/messages).
