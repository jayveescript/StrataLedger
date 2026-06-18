import Link from "next/link"
import {
  Building2,
  Shield,
  Server,
  Lock,
  Key,
  Scale,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SecurityPage() {
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
            <Link href="/security" className="text-slate-900 text-sm font-semibold border-b-2 border-blue-600 pb-0.5">Security</Link>
            <Link href="/api-docs" className="text-slate-600 hover:text-slate-900 text-sm font-medium">API</Link>
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
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Enterprise-grade security
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Security &amp; Privacy
          </h1>
          <p className="text-xl text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            Your financial data deserves bank-grade protection
          </p>
        </div>
      </section>

      {/* CERTIFICATIONS ROW */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Compliance &amp; Certifications</h2>
            <p className="text-slate-500">Built to the highest standards from day one</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield,  title: "ISO 27001",            sub: "In progress",           color: "text-blue-600",   bg: "bg-blue-50"   },
              { icon: Server,  title: "Azure Australia East",  sub: "Data residency",        color: "text-violet-600", bg: "bg-violet-50" },
              { icon: Lock,    title: "TLS 1.3",               sub: "In transit encryption", color: "text-green-600",  bg: "bg-green-50"  },
              { icon: Key,     title: "AES-256",               sub: "At rest encryption",    color: "text-amber-600",  bg: "bg-amber-50"  },
              { icon: Scale,   title: "Privacy Act 1988",      sub: "Compliant",             color: "text-rose-600",   bg: "bg-rose-50"   },
            ].map((cert) => {
              const Icon = cert.icon
              return (
                <div
                  key={cert.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center w-44 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${cert.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${cert.color}`} />
                  </div>
                  <div className="font-semibold text-slate-900 text-sm leading-tight mb-1">{cert.title}</div>
                  <div className="text-slate-500 text-xs">{cert.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DATA RESIDENCY */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-5">🇦🇺</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">All data stored in Australia</h2>
            <p className="text-slate-600 leading-relaxed text-base max-w-xl mx-auto">
              StrataLedger stores 100% of your data in Microsoft Azure&apos;s Australia East (Sydney) region.
              Your financial records never leave Australian shores.
            </p>
          </div>
        </div>
      </section>

      {/* INVOICE AI SECTION */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">How we handle invoice processing</h2>
                <p className="text-slate-600 leading-relaxed">
                  Invoice digitisation uses Azure Document Intelligence — Microsoft&apos;s OCR service running
                  within our Australian Azure environment. Invoice data is never sent to external AI services
                  or used for AI training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY COMMITMENTS */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Our Privacy Commitments</h2>
            <p className="text-slate-500">Non-negotiable principles that govern how we handle your data</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "We never sell your data",
              "We never use your data for AI training",
              "Owners can request their data anytime",
              "7-year retention per OC Act requirements",
              "Breach notification within 30 days (OAIC)",
              "Multi-tenant isolation — your data never visible to other organisations",
              "Bank details masked in all views",
              "Full audit log of all data access",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PENETRATION TESTING */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Annual independent penetration testing</h3>
              <p className="text-slate-500 text-sm">
                Results available to enterprise customers under NDA.
              </p>
            </div>
          </div>
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
