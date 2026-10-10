import { BusinessLogo } from '@/components/business-logo'
import { getSettings } from '@/lib/settings'

// Cabecera institucional: solo aparece al imprimir o guardar como PDF (en pantalla ya hay un encabezado con botones)
export async function ReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const settings = await getSettings()
  const generado = new Date().toLocaleString('es-SV', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/El_Salvador',
  })

  return (
    <header className="hidden print:flex items-center justify-between gap-6 border-b-2 border-[#B83B5E] pb-4 mb-6">
      <div className="flex items-center gap-4">
        <BusinessLogo
          src={settings.logo_url}
          name={settings.business_name}
          className="w-16 h-16 rounded-full border border-rose-100"
        />
        <div>
          <p className="font-serif text-2xl font-bold text-zinc-900">{settings.business_name}</p>
          {settings.tagline && <p className="text-xs text-zinc-500">{settings.tagline}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-zinc-900">{title}</p>
        {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
        <p className="text-xs text-zinc-500 mt-1">Generado el {generado}</p>
      </div>
    </header>
  )
}
