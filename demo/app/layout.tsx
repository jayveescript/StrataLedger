import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "StrataLedger — Transparent Strata Fund Management",
  description: "The transparent strata platform giving owners real-time visibility and giving honest managers the tools to prove it.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
