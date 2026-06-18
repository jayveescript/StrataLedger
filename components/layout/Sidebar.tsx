"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, Wallet, FileText,
  BarChart3, Hammer, ClipboardList, AlertTriangle,
  Settings, ArrowRightLeft, Wrench, Briefcase, Scale,
  Menu, ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import branding from "@/lib/branding.json"
import { useSidebar } from "./SidebarContext"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",             icon: LayoutDashboard },
  { href: "/strata-plans",       label: "Strata Plans",          icon: Building2 },
  { href: "/owners",             label: "Owners",                icon: Users },
  { href: "/levies",             label: "Levies",                icon: Wallet },
  { href: "/expenses",           label: "Expenses",              icon: FileText },
  { href: "/suppliers",          label: "Suppliers & Work Orders", icon: Wrench },
  { href: "/commission-register",label: "Commission Register",   icon: Briefcase, badge: "NEW" },
  { href: "/rules",              label: "Rules Engine",          icon: Scale,     badge: "NEW" },
  { href: "/reports",            label: "Reports",               icon: BarChart3 },
  { href: "/capital-works",      label: "Capital Works",         icon: Hammer },
  { href: "/agm",                label: "AGM & Voting",          icon: ClipboardList },
  { href: "/complaints",         label: "Complaints",            icon: AlertTriangle },
  { href: "/settings",           label: "Settings",              icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-brand-secondary flex flex-col overflow-hidden transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className={cn("border-b border-white/10 flex-shrink-0", isCollapsed ? "px-2 py-4 flex flex-col items-center gap-3" : "px-4 py-5")}>
          {isCollapsed ? (
            <>
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={toggle}
                title="Expand sidebar"
                className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-lg leading-tight truncate">{branding.name}</div>
                  <div className="text-white/50 text-xs">Manager Portal</div>
                </div>
              </div>
              <button
                onClick={toggle}
                title="Collapse sidebar"
                className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-primary text-white font-bold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && !isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary border border-brand-secondary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-white/10 flex-shrink-0", isCollapsed ? "py-3 px-2 flex flex-col items-center gap-3" : "px-3 py-4 space-y-2")}>
          <Link
            href="/portal"
            title={isCollapsed ? "Switch to Owner View" : undefined}
            className={cn(
              "flex items-center text-white/60 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-colors",
              isCollapsed ? "p-2" : "gap-2 px-3 py-2"
            )}
          >
            <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Switch to Owner View</span>}
          </Link>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 px-3 py-1")}>
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              SJ
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">Sarah Johnson</div>
                <div className="text-white/50 text-xs">Strata Manager</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  )
}
