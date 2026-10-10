// Identidad del negocio (tabla business_settings). Este archivo es seguro para componentes de cliente.
export type BusinessSettings = {
  business_name: string
  tagline: string
  currency_symbol: string
  logo_url: string
  enabled_modules: string[]
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: 'Heart Desserts',
  tagline: '',
  currency_symbol: '$',
  logo_url: '/logo.png',
  enabled_modules: ['ventas', 'caja', 'compras', 'insumos', 'productos', 'produccion', 'merma', 'proveedores', 'reportes'],
}

export function formatMoney(value: number, symbol: string = DEFAULT_SETTINGS.currency_symbol, decimals = 2) {
  const abs = Math.abs(value).toFixed(decimals)
  return `${value < 0 ? '-' : ''}${symbol}${abs}`
}
