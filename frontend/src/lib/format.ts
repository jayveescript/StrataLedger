const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' })

export const formatCurrency = (value: number) => currency.format(value)

export const formatCents = (cents: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)

export const formatDate = (value?: string | null) => (value ? dateFormat.format(new Date(value)) : '—')

export const formatDateTime = (value?: string | null) => (value ? dateTimeFormat.format(new Date(value)) : '—')

export const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

/** "StrataManager" -> "Strata Manager" */
export const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')
