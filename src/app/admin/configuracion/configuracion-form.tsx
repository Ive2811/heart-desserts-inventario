'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { BusinessLogo } from '@/components/business-logo'
import { MODULOS_SISTEMA } from '@/lib/modules'
import type { BusinessSettings } from '@/lib/business'
import { updateSettings } from './actions'

export function ConfiguracionForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(settings.business_name)
  const [eslogan, setEslogan] = useState(settings.tagline)
  const [moneda, setMoneda] = useState(settings.currency_symbol)
  const [logo, setLogo] = useState(settings.logo_url)
  const [modulos, setModulos] = useState<string[]>(settings.enabled_modules)

  const toggleModulo = (id: string) =>
    setModulos((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateSettings({
        business_name: nombre,
        tagline: eslogan,
        currency_symbol: moneda,
        logo_url: logo,
        enabled_modules: modulos,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Configuración guardada con éxito')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleGuardar} className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-zinc-900">Identidad</h2>

        <div className="flex items-center gap-4">
          <BusinessLogo src={logo || '/logo.png'} name={nombre} className="w-16 h-16 rounded-full border border-rose-100 bg-white shrink-0" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="logo" className="text-zinc-700 font-semibold">Logo</Label>
            <Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="/logo.png" className="h-10 focus-visible:ring-[#B83B5E]" />
            <p className="text-xs text-zinc-500">Sube la imagen a la carpeta public y escribe su ruta (ej. /logo.png), o pega una URL que empiece con https://.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_9rem]">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-zinc-700 font-semibold">Nombre del negocio</Label>
            <Input id="nombre" value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moneda" className="text-zinc-700 font-semibold">Símbolo de moneda</Label>
            <Input id="moneda" value={moneda} maxLength={5} onChange={(e) => setMoneda(e.target.value)} className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eslogan" className="text-zinc-700 font-semibold">Eslogan (opcional)</Label>
          <Input id="eslogan" value={eslogan} maxLength={160} onChange={(e) => setEslogan(e.target.value)} placeholder="ej. Postres hechos con cariño" className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-zinc-900">Módulos activos</h2>
          <p className="text-xs text-zinc-500 mt-1">Un módulo desactivado desaparece del panel y su dirección deja de funcionar para todos.</p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {MODULOS_SISTEMA.map((m) => (
            <label key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50/60 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={modulos.includes(m.id)}
                onChange={() => toggleModulo(m.id)}
                className="accent-[#B83B5E] w-4 h-4 rounded border-zinc-300 cursor-pointer"
              />
              <span className="text-sm font-medium text-zinc-800">{m.label}</span>
            </label>
          ))}
        </div>

        {modulos.length === 0 && <Alert variant="warning">Sin módulos activos, el panel quedará vacío para todo el personal.</Alert>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto bg-[#B83B5E] text-white hover:bg-rose-800 h-11 px-8">
        {isPending ? <><Spinner /> Guardando...</> : 'Guardar configuración'}
      </Button>
    </form>
  )
}
