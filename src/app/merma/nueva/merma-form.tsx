'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { registerWaste } from '../actions'
import { formatQuantity, unitLabel } from '@/lib/quantity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Insumo = { id: string; name: string; base_unit: 'g' | 'ml' | 'unit'; current_stock: number }

const MOTIVOS = [
  { value: 'expired', label: 'Se venció' },
  { value: 'spoiled', label: 'Se echó a perder' },
  { value: 'prep_error', label: 'Error de preparación' },
  { value: 'dropped', label: 'Se cayó o se derramó' },
  { value: 'other', label: 'Otro motivo' },
]

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'

export function MermaForm({ insumos }: { insumos: Insumo[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)

  const insumo = insumos.find((i) => i.id === insumoId)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const quantity = Number(cantidad)
    if (!insumo) return setError('Selecciona qué se perdió')
    if (!Number.isFinite(quantity) || quantity <= 0) return setError('La cantidad perdida debe ser mayor que cero')
    if (quantity > insumo.current_stock) {
      return setError(`Solo hay ${formatQuantity(insumo.current_stock, insumo.base_unit)} de ${insumo.name} en el inventario`)
    }
    if (!motivo) return setError('Elige qué pasó')

    startTransition(async () => {
      const result = await registerWaste({ ingredient_id: insumo.id, quantity, reason_code: motivo, note: nota })
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      toast.success('Pérdida registrada y descontada del inventario')
      setInsumoId('')
      setCantidad('')
      setMotivo('')
      setNota('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
          <div className="bg-red-50 p-2.5 rounded-full text-red-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">Descartar un insumo</h2>
            <p className="text-xs text-zinc-500">Para lo que se arruina, se vence o se cae por accidente.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="insumo">¿Qué se perdió?</Label>
            <select id="insumo" value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className={selectClass}>
              <option value="">Selecciona de la lista</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · hay {formatQuantity(i.current_stock, i.base_unit)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cantidad">¿Cuánto se perdió?{insumo ? ` (${unitLabel(insumo.base_unit)})` : ''}</Label>
              <Input
                id="cantidad"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="ej. 250"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-10 focus-visible:ring-[#B83B5E]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">¿Qué pasó?</Label>
              <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={selectClass}>
                <option value="">Selecciona el motivo</option>
                {MOTIVOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota">Detalle (opcional)</Label>
            <Input
              id="nota"
              maxLength={300}
              placeholder="ej. se arruinó en la refri, se cayó la bandeja"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="h-10 focus-visible:ring-[#B83B5E]"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-red-600 text-white hover:bg-red-700 transition-colors h-12 rounded-xl text-base shadow-sm"
            >
              {isPending ? 'Registrando...' : 'Confirmar pérdida'}
            </Button>
          </div>
        </form>
      </div>

      <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
        Al confirmar, la cantidad se descuenta del inventario y queda registrada en el kardex para que las cuentas cuadren.
      </p>
    </div>
  )
}
