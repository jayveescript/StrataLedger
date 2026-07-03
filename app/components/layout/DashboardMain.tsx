"use client"
import { useSidebar } from "./SidebarContext"

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {children}
    </div>
  )
}
