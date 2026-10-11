import type { Cell, Column } from './types'

// Filtra filas por texto en cualquier columna (sin distinguir mayúsculas ni acentos)
function normalizar(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function applySearch(rows: Record<string, Cell>[], columns: Column[], q: string): Record<string, Cell>[] {
  const needle = normalizar(q.trim())
  if (!needle) return rows
  return rows.filter((row) => columns.some((c) => normalizar(String(row[c.key] ?? '')).includes(needle)))
}
