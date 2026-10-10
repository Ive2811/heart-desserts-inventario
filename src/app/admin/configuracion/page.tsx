import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requireOwner } from '@/lib/auth-utils'
import { getSettings } from '@/lib/settings'
import { ConfiguracionForm } from './configuracion-form'

export default async function ConfiguracionPage() {
  await requireOwner()
  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-3xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Configuración del negocio</h1>
            <p className="text-sm text-zinc-500 mt-1">Nombre, logo, moneda y módulos activos del sistema.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
          </Link>
        </div>

        <ConfiguracionForm settings={settings} />
      </div>
    </div>
  )
}
