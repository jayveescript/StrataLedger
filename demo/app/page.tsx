"use client"
import Link from "next/link"
import { useState } from "react"
import {
  Building2, CheckCircle2, BarChart3, FileText,
  Shield, Clock, Users, TrendingUp, ChevronRight, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">StrataLedger</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/security" className="text-sm text-slate-600 hover:text-slate-900">Security</Link>
            <Link href="/api-docs" className="text-sm text-slate-600 hover:text-slate-900">API</Link>
            <Link href="#about" className="text-sm text-slate-600 hover:text-slate-900">About</Link>
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
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Built for Victoria&apos;s new OC laws 2025
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Finally see where your strata fees are actually going.
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            StrataLedger is the transparent strata platform giving owners real-time visibility and giving honest managers the tools to prove it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold">
                For Strata Managers <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/portal">
              <Button size="lg" variant="outline" className="border-blue-400 text-white hover:bg-blue-800/50 font-semibold">
                For Lot Owners <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <p className="text-blue-300 text-sm mt-8">
            Trusted by strata managers across Melbourne · No lock-in contracts
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Sound familiar?</h2>
            <p className="text-slate-500 text-lg">The strata industry has a transparency problem. Here&apos;s what owners face every day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🔴",
                title: "Hidden commissions",
                desc: "Your strata manager earns undisclosed referral fees from contractors they recommend. You have no idea how much.",
              },
              {
                emoji: "🔴",
                title: "Special levies out of nowhere",
                desc: "Poor capital works planning blindsides owners with bills of thousands of dollars. No warning. No planning. Just a demand.",
              },
              {
                emoji: "🔴",
                title: "No visibility of your money",
                desc: "You pay levies every quarter but can't see your fund balance, where it's spent, or whether the money is actually there.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-red-900 text-lg mb-2">{item.title}</h3>
                <p className="text-red-700 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">StrataLedger fixes all of this.</h2>
            <p className="text-slate-500 text-lg">Built specifically for Victorian Owners Corporations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Real-time fund visibility", desc: "Owners see live fund balances, every transaction, every expense.", color: "blue" },
              { icon: Shield, title: "Commission disclosure register", desc: "Every referral fee legally disclosed and permanently on record.", color: "blue" },
              { icon: BarChart3, title: "10-year capital works planning", desc: "Predict and prevent special levies before they blindside your owners.", color: "blue" },
              { icon: FileText, title: "VCAT-ready exports", desc: "Full audit trail, financial history, and complaint records — one click.", color: "blue" },
              { icon: Users, title: "Digital AGM management", desc: "Run compliant meetings with weighted voting, proxy management, and auto-generated minutes.", color: "blue" },
              { icon: Clock, title: "Complaint tracking", desc: "Formal complaint log with SLA tracking and escalation to Consumer Affairs Victoria.", color: "blue" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base mb-2">✅ {item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Up and running in 48 hours.</h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Migrate your portfolio in 48 hours",
                desc: "Upload a CSV from StrataMax, IntelliStrata or any tool. Our migration team handles the rest.",
              },
              {
                step: "02",
                title: "Owners get instant portal access",
                desc: "Email invite sent automatically. They see their fund balance, levies, and every expense — immediately.",
              },
              {
                step: "03",
                title: "You run a fully transparent strata",
                desc: "Every dollar tracked, disclosed, and auditable by law. Build trust. Stop complaints.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTELLISTRATA COMPARISON */}
      <section className="py-20 bg-white" id="comparison">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything IntelliStrata does,<br />
              <span className="text-brand-primary">plus what they don&apos;t.</span>
            </h2>
            <p className="text-slate-600">We built everything strata managers already expect — then added everything owners have been asking for.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-1/2">Feature</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-500 w-1/4">IntelliStrata</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-brand-primary w-1/4">StrataLedger</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Trust accounting", "✅", "✅"],
                  ["Levy management", "✅", "✅"],
                  ["AI invoice digitisation", "✅", "✅"],
                  ["Bank integration", "✅ Partial", "✅ All banks"],
                  ["AGM management + voting", "✅", "✅"],
                  ["Maintenance + work orders", "✅", "✅"],
                  ["SMS + email communications", "✅", "✅"],
                  ["Owner portal", "✅ Basic", "✅ Full"],
                  ["Debt recovery", "✅", "✅"],
                  ["Supplier management", "✅", "✅"],
                  ["ISO 27001 certified", "✅", "🔄 In progress"],
                ].map(([feature, intel, strata]) => (
                  <tr key={feature} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-700">{feature}</td>
                    <td className="py-3 px-4 text-center text-sm text-slate-500">{intel}</td>
                    <td className="py-3 px-4 text-center text-sm font-medium text-slate-700">{strata}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-2 px-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">StrataLedger Exclusive Features</div>
                  </td>
                </tr>
                {[
                  ["Commission disclosure register", "❌", "✅"],
                  ["Conflict of interest flagging", "❌", "✅"],
                  ["Special levy predictor", "❌", "✅"],
                  ["What-if fund modeller", "❌", "✅"],
                  ["Complaint + dispute module", "❌", "✅"],
                  ["VCAT submission package", "❌", "✅"],
                  ["Self-managed OC mode", "❌", "✅"],
                  ["Manager handover pack", "❌", "✅"],
                  ["Auditor collaboration workflow", "❌", "✅"],
                  ["Open REST API", "❌", "✅"],
                  ["All Australian banks (CSV)", "❌", "✅"],
                  ["Transparent pricing", "❌", "✅"],
                  ["Built for new OC laws 2025", "❌", "✅"],
                ].map(([feature, intel, strata]) => (
                  <tr key={feature} className="border-b border-green-100 bg-green-50/50 hover:bg-green-50">
                    <td className="py-3 px-4 text-sm text-slate-700 font-medium">{feature}</td>
                    <td className="py-3 px-4 text-center text-sm text-slate-400">{intel}</td>
                    <td className="py-3 px-4 text-center text-sm font-bold text-green-600">{strata}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing.<br />
              <span className="text-slate-400 font-normal text-2xl">(Unlike your strata manager.)</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Self-Managed Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <div className="mb-6">
                <div className="text-sm font-medium text-slate-500 mb-1">SELF-MANAGED</div>
                <div className="text-2xl font-bold text-slate-900 mb-2">For buildings without a strata manager</div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>Free — up to 6 lots</div>
                  <div>$19/mo — up to 15 lots</div>
                  <div>$39/mo — up to 30 lots</div>
                </div>
                <div className="mt-3 text-sm font-medium text-brand-primary italic">&quot;Fired your strata manager? We&apos;ve got you covered.&quot;</div>
              </div>
              <div className="space-y-2 mb-8">
                {["Fund tracking (Admin + Capital Works)", "Levy management", "Expense recording", "Owner portal for all lot owners", "AGM agenda builder", "Basic reports", "Commission register (N/A — no manager)", "Capital works planning"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-green-500">✅</span>{f}
                  </div>
                ))}
                {["Trust accounting", "Bank integration", "Debt recovery"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                    <span>❌</span>{f}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full">Get Started Free</Button>
            </div>

            {/* Owner Plan */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white">
              <div className="text-slate-500 font-medium text-sm mb-2">Owner Plan</div>
              <div className="text-slate-900 font-bold text-2xl mb-1">Free — up to 10 lots</div>
              <div className="text-slate-500 text-sm mb-6">Self-managed Owners Corporations</div>
              <div className="space-y-2 mb-8">
                {["$29/mo — up to 25 lots", "$59/mo — up to 50 lots", "$99/mo — up to 100 lots"].map(t => (
                  <div key={t} className="text-slate-700 text-sm">{t}</div>
                ))}
              </div>
              <div className="space-y-2 mb-8">
                {["Fund tracking", "Owner portal", "Levy management", "Expense tracking", "PDF reports"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {f}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full">Get started free</Button>
            </div>

            {/* Manager Plan */}
            <div className="border-2 border-blue-600 rounded-2xl p-8 bg-blue-600 text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
              <div className="text-blue-200 font-medium text-sm mb-2">Manager Plan</div>
              <div className="text-white font-bold text-2xl mb-1">$199/mo — up to 10 plans</div>
              <div className="text-blue-200 text-sm mb-6">Strata companies & managers</div>
              <div className="space-y-2 mb-8">
                {["$399/mo — up to 30 plans", "$699/mo — up to 75 plans", "$999/mo — unlimited plans"].map(t => (
                  <div key={t} className="text-blue-100 text-sm">{t}</div>
                ))}
              </div>
              <div className="space-y-2 mb-8">
                {["Everything in Owner +", "Commission disclosure", "AGM module", "Bank reconciliation", "White-glove migration", "Priority support"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" /> {f}
                  </div>
                ))}
              </div>
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold">Start free trial</Button>
            </div>

            {/* Enterprise */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white">
              <div className="text-slate-500 font-medium text-sm mb-2">Enterprise</div>
              <div className="text-slate-900 font-bold text-2xl mb-1">Custom pricing</div>
              <div className="text-slate-500 text-sm mb-6">For large portfolios and corporates</div>
              <div className="space-y-2 mb-8">
                {["Everything in Manager +", "API access", "Custom reporting", "Dedicated account manager", "SLA guarantee"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> {f}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full">Contact sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How we compare</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 text-slate-500 font-medium w-1/2">Feature</th>
                  <th className="text-center p-4 text-slate-500 font-medium">StrataMax</th>
                  <th className="text-center p-4 text-slate-500 font-medium">IntelliStrata</th>
                  <th className="text-center p-4 text-blue-700 font-semibold bg-blue-50">StrataLedger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Real-time owner portal", "Basic", "Yes", "✅ Yes"],
                  ["Commission disclosure", "❌", "❌", "✅ Yes"],
                  ["Special levy predictor", "❌", "❌", "✅ Yes"],
                  ["VCAT export package", "❌", "❌", "✅ Yes"],
                  ["Complaint module", "❌", "❌", "✅ Yes"],
                  ["Transparent pricing", "❌", "❌", "✅ Yes"],
                  ["CSV migration wizard", "❌", "❌", "✅ Yes"],
                  ["Built for new OC laws", "Partial", "Partial", "✅ Yes"],
                ].map(([feature, a, b, c]) => (
                  <tr key={feature} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-700 font-medium">{feature}</td>
                    <td className="p-4 text-center text-slate-500">{a}</td>
                    <td className="p-4 text-center text-slate-500">{b}</td>
                    <td className="p-4 text-center text-blue-700 font-medium bg-blue-50">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Heard from our customers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "We switched from StrataMax after 8 years. Migration took 2 days. Our owners finally stopped complaining about transparency.",
                name: "Tim R.",
                role: "Strata Manager, Melbourne",
              },
              {
                quote: "I could finally see our capital works fund balance without calling our manager. Turns out we were dangerously underfunded.",
                name: "Sarah M.",
                role: "Committee Treasurer, Southbank apartment owner",
              },
              {
                quote: "The commission disclosure register alone was worth switching. We found our previous manager was earning 15% referral fees on every contractor.",
                name: "James C.",
                role: "OC Chair, St Kilda",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 text-sm leading-relaxed italic">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">— {t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Be first when we launch.</h2>
          <p className="text-blue-200 mb-8 text-lg">
            Join 200+ strata managers and owners already on the waitlist.
          </p>
          {submitted ? (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6 text-green-300">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">You&apos;re on the list!</div>
              <div className="text-sm mt-1">We&apos;ll be in touch soon.</div>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Button type="submit" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6">
                Join the waitlist
              </Button>
            </form>
          )}
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
                  <div><a href="#features" className="hover:text-white">Features</a></div>
                  <div><a href="#pricing" className="hover:text-white">Pricing</a></div>
                  <div><Link href="/security" className="hover:text-white">Security</Link></div>
                  <div><Link href="/api-docs" className="hover:text-white">API Docs</Link></div>
                  <div><a href="#about" className="hover:text-white">About</a></div>
                  <div><Link href="/dashboard" className="hover:text-white">Manager Demo</Link></div>
                  <div><Link href="/portal" className="hover:text-white">Owner Demo</Link></div>
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
