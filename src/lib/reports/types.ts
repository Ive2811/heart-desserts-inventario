import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type ColumnType = 'text' | 'number' | 'money' | 'money4'
export type Cell = string | number

export type Column = {
  key: string
  header: string
  type?: ColumnType
  // Peso relativo del ancho de la columna en el PDF (por defecto 1)
  weight?: number
}

export type ReportData = {
  title: string
  subtitle?: string
  columns: Column[]
  rows: Record<string, Cell>[]
  totals?: Record<string, Cell>
  orientation?: 'portrait' | 'landscape'
  note?: string
}

export type ReportParams = { desde: string; hasta: string }

export type ReportDef = {
  id: string
  title: string
  description: string
  usesRange: boolean
  load: (supabase: SupabaseClient<Database>, params: ReportParams) => Promise<ReportData>
}
