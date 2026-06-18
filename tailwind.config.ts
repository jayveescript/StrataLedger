import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"
import branding from "./lib/branding.json"

function hsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const cssVars: Record<string, string> = {
  "--brand-primary":        hsl(branding.primaryColor),
  "--brand-primary-fg":     hsl(branding.primaryForeground),
  "--brand-secondary":      hsl(branding.secondaryColor),
  "--brand-secondary-fg":   hsl(branding.secondaryForeground),
  "--brand-success":        hsl(branding.successColor),
  "--brand-success-fg":     hsl(branding.successForeground),
  "--brand-warning":        hsl(branding.warningColor),
  "--brand-warning-fg":     hsl(branding.warningForeground),
  "--brand-error":          hsl(branding.errorColor),
  "--brand-error-fg":       hsl(branding.errorForeground),
  "--brand-info":           hsl(branding.infoColor),
  "--brand-info-fg":        hsl(branding.infoForeground),
  "--brand-text-primary":   hsl(branding.textPrimary),
  "--brand-text-secondary": hsl(branding.textSecondary),
  "--brand-text-muted":     hsl(branding.textMuted),
  "--brand-surface-bg":     hsl(branding.surfaceBg),
  "--brand-surface-card":   hsl(branding.surfaceCard),
  "--brand-border":         hsl(branding.borderColor),
}

const token = (v: string) => `hsl(var(${v}) / <alpha-value>)`

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          primary:   { DEFAULT: token("--brand-primary"),   fg: token("--brand-primary-fg") },
          secondary: { DEFAULT: token("--brand-secondary"), fg: token("--brand-secondary-fg") },
          success:   { DEFAULT: token("--brand-success"),   fg: token("--brand-success-fg") },
          warning:   { DEFAULT: token("--brand-warning"),   fg: token("--brand-warning-fg") },
          error:     { DEFAULT: token("--brand-error"),     fg: token("--brand-error-fg") },
          info:      { DEFAULT: token("--brand-info"),      fg: token("--brand-info-fg") },
          "text-primary":   token("--brand-text-primary"),
          "text-secondary": token("--brand-text-secondary"),
          "text-muted":     token("--brand-text-muted"),
          surface: {
            DEFAULT: token("--brand-surface-bg"),
            card:    token("--brand-surface-card"),
          },
          border: token("--brand-border"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ":root": cssVars })
    }),
  ],
}

export default config
