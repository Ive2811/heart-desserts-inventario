import { CircleCheckIcon, ClockIcon, InfoIcon, OctagonXIcon } from 'lucide-react'
import { cn } from 'cn'

export type StatusTone = 'ok' | 'critical' | 'warning' | 'info'
export type Status = { tone: StatusTone; label: string }

// Etiquetas pastel con pictograma: verde = óptimo, rojo = crítico, ámbar = próximo a vencer
const TONES = {
  ok: { Icon: CircleCheckIcon, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  critical: { Icon: OctagonXIcon, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  warning: { Icon: ClockIcon, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  info: { Icon: InfoIcon, cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
} as const

export function StatusBadge({ status, className }: { status: Status | null; className?: string }) {
  if (!status) return null
  const { Icon, cls } = TONES[status.tone]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap', cls, className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {status.label}
    </span>
  )
}

export function stockStatus(current: number, min: number): Status {
  if (current <= 0) return { tone: 'critical', label: 'Agotado' }
  if (min > 0 && current <= min) return { tone: 'critical', label: 'Crítico' }
  return { tone: 'ok', label: 'Óptimo' }
}

export function expiryStatus(daysLeft: number): Status {
  if (daysLeft < 0) return { tone: 'critical', label: 'Vencido' }
  if (daysLeft === 0) return { tone: 'critical', label: 'Vence hoy' }
  if (daysLeft === 1) return { tone: 'warning', label: 'Vence mañana' }
  return { tone: 'warning', label: `Vence en ${daysLeft} días` }
}
