import type { ReactNode } from 'react'
import { AlertCircle, SearchX } from 'lucide-react'
import { Button } from './Button'

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`ui-skeleton ${className}`} />
}
export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="ui-loading">
      <span className="sr-only">{label}</span>
      <Skeleton className="ui-skeleton-title" />
      {[0, 1, 2].map((row) => (
        <div className="ui-skeleton-row" key={row}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  )
}
export function EmptyState({
  title = 'No matching items',
  description = 'Try a different search or clear your filters.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="ui-state">
      <SearchX size={27} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function ErrorState({
  onRetry,
  title = 'We couldn’t load this view',
  description = 'Your work is safe. Try loading this view again.',
  retrying = false,
}: {
  onRetry: () => void
  title?: string
  description?: string
  retrying?: boolean
}) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <AlertCircle size={27} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      <Button variant="secondary" busy={retrying} onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
export function QueryState({
  loading,
  error,
  empty,
  onRetry,
  children,
  emptyAction,
}: {
  loading: boolean
  error: boolean
  empty: boolean
  onRetry: () => void
  children: ReactNode
  emptyAction?: ReactNode
}) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState onRetry={onRetry} />
  if (empty) return <EmptyState action={emptyAction} />
  return <>{children}</>
}
