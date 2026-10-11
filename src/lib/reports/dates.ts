const TZ = 'America/El_Salvador'

export function formatDateTimeSV(iso: string): string {
  return new Date(iso).toLocaleString('es-SV', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Día local de El Salvador en formato AAAA-MM-DD (para agrupar por día, no por día UTC)
export function dateKeySV(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}
