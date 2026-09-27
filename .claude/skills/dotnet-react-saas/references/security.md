# Security

Skeleton paths are relative to `templates/skeleton/backend/src/` unless noted.

## Contents
[Passwords & lockout](#passwords) · [Tokens](#tokens) · [Refresh tokens](#refresh-tokens) · [MFA](#mfa) ·
[Revocation](#revocation) · [Authorization](#authorization) · [Rate limiting](#rate-limiting) ·
[Headers, CORS, uploads](#headers) · [Audit](#audit) · [Review checklist](#checklist)

<a id="passwords"></a>
## Passwords, lockout, enumeration

- `AddIdentityCore<ApplicationUser>` (no role tables — role is an enum column). Options in
  `MyApp.Infrastructure/DependencyInjection.cs`: length 12, upper/lower/digit/symbol, 5 unique chars, lockout 5 tries /
  15 min, PBKDF2 600k iterations.
- Extra validators (`Identity/PasswordValidators.cs`): breached password (HIBP k-anonymity range API, only 5 SHA-1
  hex chars leave the server, **fails open** with a warning), personal info (name/email fragment), history.
- History stores **outgoing** hashes on each change and the validator also checks the **current** hash — so accounts
  created by any path are covered (storing only new hashes misses the original password).
- Login (`Application/Features/Auth/Login.cs`) returns one identical error for unknown email / wrong password /
  locked / inactive / suspended tenant, and verifies against a dummy hash for unknown emails (timing).
- Forgot-password always returns 202. Reset tokens expire in 1 h. Password change/reset revokes all sessions and
  emails the user.

<a id="tokens"></a>
## Access tokens

- RS256 JWT, 15 min, claims: `sub`, `email`, `name`, `role`, `tenant_id`, `sstamp` (security stamp), `tsv`
  (tenant session version), `jti`. Created with `JwtSecurityTokenHandler` with empty `OutboundClaimTypeMap`; validated
  with `MapInboundClaims = false`, `RoleClaimType = "role"`, `ValidAlgorithms = [RS256]`, 30 s clock skew
  (`Api/Infrastructure/AuthenticationSetup.cs`).
- Signing key: `Jwt:SigningKeyPem` or `Jwt:SigningKeyPath` (mounted secret). Development/Testing auto-generate and
  persist a dev key; any other environment throws at startup without one.
- SPA keeps the access token **in memory only**.

<a id="refresh-tokens"></a>
## Refresh tokens (`Infrastructure/Identity/AuthSessionService.cs`)

- 48 random bytes, stored as SHA-256 hash, 14-day expiry, IP + user agent recorded (session list).
- Rotation on every refresh; tokens from one login share a `FamilyId`.
- Reuse of an already-rotated token **after a 20 s grace** revokes the whole family and audits it (theft
  detection). The grace avoids logging users out when two tabs refresh concurrently.
- Cookie: `sl_rt`-style name, `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. `/auth/refresh` additionally
  requires a custom header (`X-<App>-Csrf`) so cross-site forms cannot trigger it; CORS allows that header only
  from the configured origin. Serve SPA and API on the same site (nginx/Vite proxy) so the cookie stays first-party.

<a id="mfa"></a>
## MFA (TOTP)

- Mandatory for every role except the end-customer role (`ApplicationUser.RequiresMfa`); optional there.
- Sign-in steps are data: `(TwoFactorEnabled, RequiresMfa)` → `Completed | MfaRequired | MfaEnrollmentRequired`
  (`SignInFlow`). Between steps the client holds a 5-minute `ITimeLimitedDataProtector` challenge token, never a
  session.
- Enrollment: reset authenticator key → `otpauth://` URI + formatted key → confirm a code → 10 recovery codes → email
  notification. Verification accepts recovery codes.
- Replay guard: a used code is cached (`mfa:used:{user}:{code}`, 3 min) and rejected if presented again.
- Failed MFA attempts count toward lockout.

<a id="revocation"></a>
## Instant revocation

`JwtBearerEvents.OnTokenValidated` → `ISessionValidator.IsValidAsync(userId, sstamp, tenantId, tsv)`, backed by a
2-minute distributed cache of `(stamp, active)` per user and `(sessionVersion, active)` per tenant, invalidated on
change. Triggers: password change/reset, role or activation change, "sign out everywhere", admin revoke, tenant
force-logout, tenant suspension. Refresh tokens are revoked alongside.

<a id="authorization"></a>
## Authorization model

- Roles (enum): `SuperAdmin` (platform), `TenantAdmin`, `Manager`, `Viewer`, `Member` (end customer). Rename to fit
  the product; keep one enum.
- `RolePermissions` (`Domain/Authorization`) maps role → `FrozenSet<Permission>`; SuperAdmin gets all.
- `InvitationPolicy` maps who may grant which role (nobody grants SuperAdmin via tenant flows; users cannot change
  their own role; managers can't touch admins).
- HTTP layer: `[Authorize(Roles=…)]` + `[HasPermission]` + `[FeatureGate]` via `DynamicPolicyProvider`.
  Application layer: `[RequiresPermission]` + `[RequiresFeature]` via `AuthorizationBehavior`. Keep both in sync.

<a id="rate-limiting"></a>
## Rate limiting / anti-spam (`Api/Infrastructure/RateLimiting.cs`)

| Policy | Partition | Limit |
|---|---|---|
| `auth` (login, MFA, reset, invitations) | client IP | 20/min |
| `session` (refresh, logout) | client IP | 120/min |
| `bulk` (uploads, resend) | user or IP | 20/min |
| global | user or IP | 300/min |

Redis sliding windows (`RedisRateLimiting.AspNetCore`) when `ConnectionStrings:Redis` is set, in-memory otherwise;
the store is chosen once at startup. 429 ProblemDetails with `Retry-After`. Keep per-IP auth limits generous enough
for offices behind one NAT — account lockout is what stops password guessing. Add an nginx `limit_req` at the edge.
`RateLimiting:Disabled=true` exists for tests only.

<a id="headers"></a>
## Headers, CORS, uploads, errors

- API: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`,
  `CSP: default-src 'none'`, `Cache-Control: no-store` (public assets excepted), HSTS outside Development, no server
  header. SPA (nginx): CSP `script-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`.
- CORS: explicit origin, explicit methods/headers, credentials.
- Forwarded headers: only trust the proxy hop (API should not be publicly reachable except through the proxy, or
  clients can spoof `X-Forwarded-For` to dodge per-IP limits).
- Uploads: per-endpoint `RequestSizeLimit` (global Kestrel limit 1 MB), extension allow-list, **magic-byte sniffing**
  (no SVG), content type taken from sniffing not the client, CSV-injection prefixes stripped, row caps.
- Invitation/reset tokens: random, single-use, stored hashed, expiring (72 h / 1 h).

<a id="audit"></a>
## Audit

- Data changes: `AuditingInterceptor` writes property-level diffs (secrets excluded) in the same transaction.
- Security events: `IAuditWriter.WriteSecurityEventAsync` uses a separate scope/DbContext so they persist even when
  the request's transaction rolls back (failed logins, lockouts, reuse detection, force logout).
- Exposed to TenantAdmin/Viewer (feature `AuditLog`) and Super Admin (platform-wide).

<a id="checklist"></a>
## Security review checklist

- [ ] No token in `localStorage`/`sessionStorage`; refresh cookie flags correct; CSRF header enforced
- [ ] Every non-auth endpoint behind fallback auth policy; anonymous endpoints explicitly marked and rate-limited
- [ ] Permission + feature attributes on controller and request; tenant resolved via `ResolveTenant`
- [ ] Other-tenant ids return 404; app DB role cannot bypass RLS
- [ ] Lockout on; password validators registered; uniform login errors
- [ ] MFA enforced for privileged roles; codes not replayable
- [ ] Role/password/status changes revoke sessions immediately
- [ ] Uploads sniffed and size-limited; no SVG; CSV sanitised
- [ ] Security headers + CSP present; CORS explicit; HSTS in production
- [ ] Secrets only from environment/secret mounts; no dev keys outside Development
