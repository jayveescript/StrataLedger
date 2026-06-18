"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, Wallet, Building2, FolderOpen, AlertTriangle, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import branding from "@/lib/branding.json"

const navItems = [
  { href: "/portal", label: "My Overview", icon: Home },
  { href: "/portal/levies", label: "My Levies", icon: Wallet },
  { href: "/portal/funds", label: "Fund Balances", icon: Building2 },
  { href: "/portal/documents", label: "Documents", icon: FolderOpen },
  { href: "/portal/complaints", label: "Complaints", icon: AlertTriangle },
]

export function OwnerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900 font-bold text-lg leading-tight">{branding.name}</div>
              <div className="text-slate-500 text-xs">Owner Portal</div>
            </div>
          </div>
          <div className="bg-brand-primary/10 rounded-lg p-3">
            <div className="text-slate-900 font-semibold text-sm">James Chen</div>
            <div className="text-slate-500 text-xs">Lot 7 · Southbank Residences</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manager View
          </Link>
          <div className="px-3 py-2 text-xs text-slate-400">
            Logged in as: james.chen@email.com
          </div>
        </div>
      </div>
    </aside>
  )
}
