// Etiquetas en español para valores internos de la base de datos (que están en inglés)
export const UNIT_LABEL: Record<string, string> = { g: 'g', ml: 'ml', unit: 'unid' }

export const MOVEMENT_LABEL: Record<string, string> = {
  purchase: 'Compra',
  production: 'Producción',
  sale: 'Venta',
  waste: 'Merma',
  adjustment: 'Ajuste',
  reversal: 'Reversión',
}

// Los canales de venta ahora son un catálogo editable (tabla sale_channels), ya no una lista fija
export const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

export const REASON_LABEL: Record<string, string> = {
  expired: 'Vencido',
  prep_error: 'Error de preparación',
  dropped: 'Se cayó',
  spoiled: 'Arruinado',
  other: 'Otro',
}
