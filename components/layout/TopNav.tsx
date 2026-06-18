"use client"
import { Bell, HelpCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface TopNavProps {
  title: string
  breadcrumb?: string
}

export function TopNav({ title, breadcrumb }: TopNavProps) {
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        {breadcrumb && <div className="text-xs text-slate-400 uppercase tracking-wide">{breadcrumb}</div>}
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </Button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
              <div className="p-4 border-b border-slate-100">
                <div className="font-semibold text-slate-900">Notifications</div>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="p-4 text-sm">
                  <div className="font-medium text-slate-900">Levy overdue — Lot 12</div>
                  <div className="text-slate-500 text-xs mt-0.5">Southbank Residences · 32 days overdue</div>
                </div>
                <div className="p-4 text-sm">
                  <div className="font-medium text-slate-900">AGM due in 58 days</div>
                  <div className="text-slate-500 text-xs mt-0.5">Southbank Residences · Action required</div>
                </div>
                <div className="p-4 text-sm">
                  <div className="font-medium text-slate-900">New complaint submitted</div>
                  <div className="text-slate-500 text-xs mt-0.5">St Kilda Beach Villas · Lot 3 · High priority</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5 text-slate-500" />
        </Button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">SJ</div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  )
}
