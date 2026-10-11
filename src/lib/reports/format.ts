import type { Cell, Column } from './types'

const nf = (decimals: number) =>
  new Intl.NumberFormat('es-SV', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

// Texto de una celda para pantalla y PDF (en Excel se escriben números reales)
export function formatCell(column: Column, value: Cell | undefined, symbol: string): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'string') return value
  switch (column.type) {
    case 'money':
      return `${value < 0 ? '-' : ''}${symbol}${nf(2).format(Math.abs(value))}`
    case 'money4':
      return `${value < 0 ? '-' : ''}${symbol}${nf(4).format(Math.abs(value))}`
    case 'number':
      return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 3 }).format(value)
    default:
      return String(value)
  }
}

export function isNumeric(column: Column): boolean {
  return column.type === 'money' || column.type === 'money4' || column.type === 'number'
}
