import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PASSWORD_RULES, passwordScore } from '@/lib/passwordPolicy'

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success']

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password)
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < score ? COLORS[score] : 'bg-ink/10')} />
        ))}
      </div>
      <p className="text-xs text-ink-soft">Strength: <span className="font-medium text-ink">{LABELS[score]}</span></p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password)
          return (
            <li key={rule.id} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-success' : 'text-ink-muted')}>
              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {rule.label}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-ink-muted">Passwords found in known data breaches, containing your name, or used recently are rejected.</p>
    </div>
  )
}
