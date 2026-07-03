import { OwnerSidebar } from "@/components/layout/OwnerSidebar"

export default function OwnerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
}
