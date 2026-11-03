import { AlertTriangle, CheckCircle2, Circle, Clock3, PackagePlus } from 'lucide-react'
import type { StockState, Urgency } from '../api/types'

type Tone = 'risk' | 'healthy' | 'overstock' | 'neutral'
const stockLabels: Record<StockState, { label: string; tone: Tone; icon: typeof Circle }> = {
  'at-risk': { label: 'Stock-out risk', tone: 'risk', icon: AlertTriangle },
  healthy: { label: 'Healthy', tone: 'healthy', icon: CheckCircle2 },
  overstock: { label: 'Overstock', tone: 'overstock', icon: PackagePlus },
}
const urgencyLabels: Record<Urgency, { label: string; tone: Tone; icon: typeof Circle }> = {
  urgent: { label: 'Order now', tone: 'risk', icon: AlertTriangle },
  soon: { label: 'Order soon', tone: 'overstock', icon: Clock3 },
  none: { label: 'No order needed', tone: 'neutral', icon: CheckCircle2 },
}
export function Badge({
  label,
  tone = 'neutral',
  icon: Icon = Circle,
}: {
  label: string
  tone?: Tone
  icon?: typeof Circle
}) {
  return (
    <span className={`ui-badge ui-badge--${tone}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  )
}
export function StockBadge({ state }: { state: StockState }) {
  return <Badge {...stockLabels[state]} />
}
export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge {...urgencyLabels[urgency]} />
}
