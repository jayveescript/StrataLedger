import Link from "next/link"
import {
  Building2,
  Shield,
  Lock,
  KeyRound,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const endpoints: { method: "GET" | "POST"; path: string; scope: string }[] = [
  { method: "GET",  path: "/api/v1/strata-plans",                scope: "read:plans" },
  { method: "GET",  path: "/api/v1/strata-plans/{id}",           scope: "read:plans" },
  { method: "GET",  path: "/api/v1/lots",                        scope: "read:plans" },
  { method: "GET",  path: "/api/v1/owners",                      scope: "read:owners" },
  { method: "GET",  path: "/api/v1/levies",                      scope: "read:levies" },
  { method: "GET",  path: "/api/v1/expenses",                    scope: "read:expenses" },
  { method: "GET",  path: "/api/v1/funds/balance",               scope: "read:funds" },
  { method: "GET",  path: "/api/v1/reports/financial-statement", scope: "read:reports" },
  { method: "GET",  path: "/api/v1/reports/levy-arrears",        scope: "read:reports" },
  { method: "POST", path: "/api/v1/payments",                    scope: "write:payments" },
  { method: "POST", path: "/api/v1/expenses",                    scope: "write:expenses" },
  { method: "GET",  path: "/api/v1/audit-trail",                 scope: "read:audit" },
]

const errorCodes = [
  { status: "400", error: "invalid_request / unsupported_grant_type / invalid_scope", desc: "Malformed request or unsupported OAuth parameters" },
  { status: "401", error: "invalid_client / invalid_token", desc: "Bad client credentials, or a missing/expired bearer token (see WWW-Authenticate header)" },
  { status: "403", error: "insufficient_scope", desc: "Token is valid but doesn't carry the scope this endpoint requires" },
  { status: "422", error: "validation_failed", desc: "Write request body failed validation" },
  { status: "429", error: "slow_down", desc: "Token endpoint rate limit hit — respect Retry-After" },
]

const useCases = [
  {
    emoji: "🔗",
    title: "Accounting software integration",
    desc: "Connect Xero or MYOB to pull levy and expense data automatically.",
  },
  {
    emoji: "📊",
    title: "Custom reporting",
    desc: "Build your own dashboards using your preferred BI tool.",
  },
  {
    emoji: "🔄",
    title: "Data portability",
    desc: "Export everything anytime. No lock-in, ever.",
  },
]

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">StrataLedger</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Features</Link>
            <Link href="/#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Pricing</Link>
            <Link href="/security" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Security</Link>
            <Link href="/api-docs" className="text-slate-900 text-sm font-semibold border-b-2 border-blue-600 pb-0.5">API</Link>
            <Link href="/#about" className="text-slate-600 hover:text-slate-900 text-sm font-medium">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Manager Login</Button>
            </Link>
            <Link href="/portal">
              <Button size="sm">Owner Portal</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-slate-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-300 text-sm font-medium mb-8">
            ⭐ Not available in IntelliStrata
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            StrataLedger Open API
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect your tools. Your data is always yours.
          </p>
        </div>
      </section>

      {/* PHILOSOPHY BOX */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-slate-700 leading-relaxed text-base">
                We believe in data portability. Unlike other strata platforms, StrataLedger provides a
                full REST API so you can integrate with your existing tools, build custom reports, or
                switch platforms anytime without losing your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHENTICATION */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Authentication</h2>
            </div>
            <p className="text-slate-500">
              OAuth 2.0 client credentials flow (RFC 6749). Exchange your client credentials for a
              short-lived JWT, then send it as a Bearer token (RFC 6750) on every request.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">1 — Request an access token</div>
              <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto text-slate-100 leading-relaxed">
                <div className="text-slate-400"># Token endpoint — client_credentials grant</div>
                <div>curl -X POST https://your-deployment.vercel.app/api/oauth/token \</div>
                <div>{"  "}-u demo_readonly:sl_demo_readonly_4f8a2b1c9d3e \</div>
                <div>{"  "}-d grant_type=client_credentials</div>
                <div className="mt-4 text-slate-400"># Response</div>
                <div>{"{"}</div>
                <div>{"  "}&quot;access_token&quot;: &quot;eyJhbGciOiJIUzI1NiIs...&quot;,</div>
                <div>{"  "}&quot;token_type&quot;: &quot;Bearer&quot;,</div>
                <div>{"  "}&quot;expires_in&quot;: 3600,</div>
                <div>{"  "}&quot;scope&quot;: &quot;read:plans read:owners read:levies ...&quot;</div>
                <div>{"}"}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">2 — Call the API with the Bearer token</div>
              <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto text-slate-100 leading-relaxed">
                <div>curl https://your-deployment.vercel.app/api/v1/levies?status=overdue \</div>
                <div>{"  "}-H &quot;Authorization: Bearer $ACCESS_TOKEN&quot;</div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              <div className="font-semibold mb-1">Demo credentials</div>
              <p className="mb-2">This deployment serves static mock data, so two demo clients are pre-registered:</p>
              <div className="font-mono text-xs space-y-1">
                <div>demo_readonly / sl_demo_readonly_4f8a2b1c9d3e — all read:* scopes</div>
                <div>demo_full_access / sl_demo_full_7c1e5d9a3b2f — read + write scopes</div>
              </div>
              <p className="mt-2 text-xs">Tokens expire after 1 hour. Production deployments register real clients via the <span className="font-mono">OAUTH_CLIENTS</span> env var and sign tokens with <span className="font-mono">AUTH_SECRET</span>.</p>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">Error responses</div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Error code</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {errorCodes.map(e => (
                      <tr key={e.status}>
                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{e.status}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{e.error}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVAILABLE ENDPOINTS */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Endpoints</h2>
            <p className="text-slate-500">
              Full REST API coverage across your strata portfolio. Every endpoint requires a Bearer
              token carrying the listed scope.
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
            <div className="space-y-3">
              {endpoints.map(({ method, path, scope }) => (
                <div key={`${method}-${path}`} className="flex items-center gap-4">
                  <span
                    className={`w-12 text-right font-bold flex-shrink-0 ${
                      method === "GET" ? "text-green-400" : "text-amber-400"
                    }`}
                  >
                    {method}
                  </span>
                  <span className="text-white flex-1">{path}</span>
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                    <Lock className="w-3 h-3" />
                    {scope}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What you can build</h2>
            <p className="text-slate-500">Real-world integrations powered by the StrataLedger API</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{uc.emoji}</div>
                <h3 className="font-semibold text-slate-900 text-base mb-2">{uc.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">The API is live on this deployment</h2>
          <p className="text-blue-200 mb-8 text-base">
            Grab a token with the demo credentials above and start exploring — every endpoint
            serves the same mock data you see in the app.
          </p>
          <Link href="/dashboard">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
              Explore the app <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold">StrataLedger</span>
              </div>
              <div className="text-sm leading-relaxed max-w-xs">
                The transparent strata management platform built for Victorian Owners Corporations.
              </div>
            </div>
            <div className="flex gap-12">
              <div>
                <div className="text-white font-medium text-sm mb-3">Product</div>
                <div className="space-y-2 text-sm">
                  <div><Link href="/#features" className="hover:text-white">Features</Link></div>
                  <div><Link href="/#pricing" className="hover:text-white">Pricing</Link></div>
                  <div><Link href="/security" className="hover:text-white">Security</Link></div>
                  <div><Link href="/api-docs" className="hover:text-white">API Docs</Link></div>
                  <div><Link href="/#about" className="hover:text-white">About</Link></div>
                </div>
              </div>
              <div>
                <div className="text-white font-medium text-sm mb-3">Legal</div>
                <div className="space-y-2 text-sm">
                  <div><a href="#" className="hover:text-white">Privacy Policy</a></div>
                  <div><a href="#" className="hover:text-white">Terms of Service</a></div>
                  <div><a href="#" className="hover:text-white">Contact</a></div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between text-sm gap-2">
            <div>© 2026 StrataLedger Pty Ltd · Melbourne, Australia</div>
            <div>Built for Victorian Owners Corporations Act 2006</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
