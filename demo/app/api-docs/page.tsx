import Link from "next/link"
import {
  Building2,
  Shield,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const endpoints: { method: "GET" | "POST"; path: string }[] = [
  { method: "GET",  path: "/api/v1/strata-plans" },
  { method: "GET",  path: "/api/v1/strata-plans/{id}" },
  { method: "GET",  path: "/api/v1/lots" },
  { method: "GET",  path: "/api/v1/owners" },
  { method: "GET",  path: "/api/v1/levies" },
  { method: "GET",  path: "/api/v1/expenses" },
  { method: "GET",  path: "/api/v1/funds/balance" },
  { method: "GET",  path: "/api/v1/reports/financial-statement" },
  { method: "GET",  path: "/api/v1/reports/levy-arrears" },
  { method: "POST", path: "/api/v1/payments" },
  { method: "POST", path: "/api/v1/expenses" },
  { method: "GET",  path: "/api/v1/audit-trail" },
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

      {/* AVAILABLE ENDPOINTS */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Endpoints</h2>
            <p className="text-slate-500">Full REST API coverage across your strata portfolio</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
            <div className="space-y-3">
              {endpoints.map(({ method, path }) => (
                <div key={`${method}-${path}`} className="flex items-center gap-4">
                  <span
                    className={`w-12 text-right font-bold flex-shrink-0 ${
                      method === "GET" ? "text-green-400" : "text-amber-400"
                    }`}
                  >
                    {method}
                  </span>
                  <span className="text-white">{path}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-16 px-6 bg-white">
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
          <h2 className="text-2xl font-bold mb-3">API documentation coming at launch</h2>
          <p className="text-blue-200 mb-8 text-base">
            Be among the first to get access and shape our developer experience.
          </p>
          <Link href="/#waitlist">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
              Join waitlist for API access <ChevronRight className="ml-1 w-4 h-4" />
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
