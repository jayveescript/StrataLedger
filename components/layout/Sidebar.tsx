"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, Wallet, FileText,
  BarChart3, Hammer, ClipboardList, AlertTriangle,
  Settings, ArrowRightLeft, Wrench, Briefcase, Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import branding from "@/lib/branding.json"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/strata-plans", label: "Strata Plans", icon: Building2 },
  { href: "/owners", label: "Owners", icon: Users },
  { href: "/levies", label: "Levies", icon: Wallet },
  { href: "/expenses", label: "Expenses", icon: FileText },
  { href: "/suppliers", label: "Suppliers & Work Orders", icon: Wrench },
  { href: "/commission-register", label: "Commission Register", icon: Briefcase, badge: "NEW" },
  { href: "/rules", label: "Rules Engine", icon: Scale, badge: "NEW" },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/capital-works", label: "Capital Works", icon: Hammer },
  { href: "/agm", label: "AGM & Voting", icon: ClipboardList },
  { href: "/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-brand-secondary flex flex-col">
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{branding.name}</div>
              <div className="text-white/50 text-xs">Manager Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-primary text-white font-bold leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <Link
            href="/portal"
            className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Switch to Owner View
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-semibold">SJ</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">Sarah Johnson</div>
              <div className="text-white/50 text-xs">Strata Manager</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
