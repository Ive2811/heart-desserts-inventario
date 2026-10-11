// Formato de cantidades en unidad base (g, ml, unidades) para pantallas de inventario.
type BaseUnit = 'g' | 'ml' | 'unit'

export function formatQuantity(value: number, unit: BaseUnit): string {
  const n = Number(value)
  const fmt = (x: number, d = 2) => new Intl.NumberFormat('es-SV', { maximumFractionDigits: d }).format(x)
  if (unit === 'g') return n >= 1000 ? `${fmt(n / 1000)} kg` : `${fmt(n, 1)} g`
  if (unit === 'ml') return n >= 1000 ? `${fmt(n / 1000)} l` : `${fmt(n, 1)} ml`
  return `${fmt(n, 1)} unid.`
}

export function unitLabel(unit: BaseUnit): string {
  return unit === 'unit' ? 'unidades' : unit
}
