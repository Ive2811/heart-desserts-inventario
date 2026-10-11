import type { ReportParams } from './types'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TZ = 'America/El_Salvador'
const MAX_DAYS = 366

export function todaySV(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function validDate(value: string | undefined): value is string {
  if (!value || !DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}

// Lee desde/hasta de la URL; por defecto: del día 1 del mes actual a hoy. Máximo 366 días.
export function parseRange(raw: { desde?: string; hasta?: string }): ReportParams & { error?: string } {
  const hoy = todaySV()
  let hasta = validDate(raw.hasta) ? raw.hasta : hoy
  let desde = validDate(raw.desde) ? raw.desde : `${hoy.slice(0, 8)}01`
  let error: string | undefined

  if (desde > hasta) {
    ;[desde, hasta] = [hasta, desde]
  }
  const dias = (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000
  if (dias > MAX_DAYS) {
    desde = new Date(Date.parse(`${hasta}T00:00:00Z`) - MAX_DAYS * 86_400_000).toISOString().slice(0, 10)
    error = `El rango máximo es de ${MAX_DAYS} días; se ajustó la fecha inicial.`
  }
  return { desde, hasta, error }
}

// Límites en ISO para filtrar columnas timestamptz usando la hora de El Salvador (UTC-6, sin horario de verano)
export function rangeIso({ desde, hasta }: ReportParams): { start: string; end: string } {
  const next = new Date(Date.parse(`${hasta}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
  return { start: `${desde}T00:00:00-06:00`, end: `${next}T00:00:00-06:00` }
}

export function formatDMY(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
