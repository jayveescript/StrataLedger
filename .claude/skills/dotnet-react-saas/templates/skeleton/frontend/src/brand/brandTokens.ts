import type { Branding } from '@/api/types'

export type BrandColorKey = Exclude<keyof Branding, 'displayName' | 'logoMark' | 'logoUrl'>

/** Branding field -> CSS custom property. Adding a token is a one-line change here. */
export const BRAND_CSS_VARS: Record<BrandColorKey, string> = {
  primaryColor: '--brand-primary',
  primaryForeground: '--brand-primary-fg',
  secondaryColor: '--brand-secondary',
  secondaryForeground: '--brand-secondary-fg',
  successColor: '--brand-success',
  warningColor: '--brand-warning',
  errorColor: '--brand-error',
  infoColor: '--brand-info',
  textPrimary: '--brand-text-primary',
  textSecondary: '--brand-text-secondary',
  textMuted: '--brand-text-muted',
  surfaceBg: '--brand-surface-bg',
  surfaceCard: '--brand-surface-card',
  borderColor: '--brand-border',
}

export const BRAND_COLOR_LABELS: Record<BrandColorKey, string> = {
  primaryColor: 'Primary',
  primaryForeground: 'Text on primary',
  secondaryColor: 'Secondary',
  secondaryForeground: 'Text on secondary',
  successColor: 'Success',
  warningColor: 'Warning',
  errorColor: 'Error',
  infoColor: 'Info',
  textPrimary: 'Body text',
  textSecondary: 'Secondary text',
  textMuted: 'Muted text',
  surfaceBg: 'Page background',
  surfaceCard: 'Card background',
  borderColor: 'Borders',
}

export const DEFAULT_BRANDING: Branding = {
  displayName: 'MyApp',
  logoMark: 'SL',
  logoUrl: null,
  primaryColor: '#84cc16',
  primaryForeground: '#1a2e05',
  secondaryColor: '#d1d5db',
  secondaryForeground: '#111827',
  successColor: '#16a34a',
  warningColor: '#d97706',
  errorColor: '#dc2626',
  infoColor: '#2563eb',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  surfaceBg: '#f8fafc',
  surfaceCard: '#ffffff',
  borderColor: '#e2e8f0',
}

export function applyBranding(branding: Branding, root: HTMLElement = document.documentElement) {
  ;(Object.keys(BRAND_CSS_VARS) as BrandColorKey[]).forEach((key) => root.style.setProperty(BRAND_CSS_VARS[key], branding[key]))
  document.title = branding.displayName
  const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null
  if (favicon) favicon.href = branding.logoUrl ?? monogramFavicon(branding)
}

function monogramFavicon(b: Branding) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${b.primaryColor}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${b.logoMark.length > 2 ? 22 : 28}" fill="${b.primaryForeground}">${b.logoMark}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
