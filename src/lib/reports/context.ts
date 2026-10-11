import { createClient } from '@/lib/supabase/server'
import { checkIsOwner } from '@/lib/auth-utils'
import { getSettings } from '@/lib/settings'
import { getReport } from './definitions'
import { parseRange } from './params'
import { applySearch } from './search'
import type { ReportData } from './types'

// Carga un reporte con los filtros de la URL. Solo la administradora puede verlo o exportarlo.
export async function loadReport(id: string, raw: { desde?: string; hasta?: string; q?: string }) {
  if (!(await checkIsOwner())) return { status: 403 as const }

  const def = getReport(id)
  if (!def) return { status: 404 as const }

  const range = parseRange(raw)
  const supabase = await createClient()
  const settings = await getSettings()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle() : { data: null }

  const full = await def.load(supabase, range)
  const q = (raw.q ?? '').slice(0, 80)
  const filtered: ReportData = q
    ? { ...full, rows: applySearch(full.rows, full.columns, q), totals: undefined, note: [full.note, 'Totales omitidos: hay una búsqueda activa.'].filter(Boolean).join(' ') }
    : full

  return {
    status: 200 as const,
    def,
    range,
    q,
    data: filtered,
    settings,
    userName: profile?.full_name?.trim() || 'usuario del sistema',
  }
}
