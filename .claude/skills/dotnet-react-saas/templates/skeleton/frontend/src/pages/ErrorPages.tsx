import { ShieldAlert, SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { Button, Card } from '@/components/atoms'

function ErrorCard({ icon: Icon, title, text }: { icon: typeof SearchX; title: string; text: string }) {
  return (
    <Card className="mx-auto mt-16 max-w-md p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-ink-muted" />
      <h1 className="mt-3 text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
      <Button asChild variant="outline" className="mt-5"><Link to="/">Go home</Link></Button>
    </Card>
  )
}

export const NotFoundPage = () => <ErrorCard icon={SearchX} title="Page not found" text="The page you're looking for doesn't exist." />

export const ForbiddenPage = () => <ErrorCard icon={ShieldAlert} title="Access denied" text="Your role doesn't have access to this area. Ask your tenant administrator if you need it." />
