import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' } as const

export function Spinner({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return <LoaderCircle aria-hidden className={cn('animate-spin', sizes[size], className)} />
}
