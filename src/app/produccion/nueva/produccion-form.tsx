'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Minus, Package, Plus } from 'lucide-react'
import { registerProduction } from '../actions'
import { formatQuantity } from '@/lib/quantity'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ProductoTanda = {
  id: string
  name: string
  current_stock: number
  yield_portions: number
  items: { name: string; base_unit: 'g' | 'ml' | 'unit'; stock: number; quantity: number; waste_pct: number }[]
}

const selectClass =
  'flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'

export function ProduccionForm({ productos }: { productos: ProductoTanda[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [productId, setProductId] = useState(productos[0]?.id ?? '')
  const [tandas, setTandas] = useState(1)
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)

  const producto = productos.find((p) => p.id === productId)
  const unidades = producto ? tandas * producto.yield_portions : 0

  const requeridos = (producto?.items ?? []).map((it) => {
    const requerido = it.quantity * tandas * (1 + it.waste_pct / 100)
    return { ...it, requerido, falta: requerido > it.stock }
  })
  const hayFaltantes = requeridos.some((r) => r.falta)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!producto) return setError('Elige el producto a elaborar')

    startTransition(async () => {
      const result = await registerProduction({ product_id: producto.id, tandas, note: nota })
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(`Producción registrada: ${result.portions} unidades de ${producto.name}`)
      setTandas(1)
      setNota('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="producto">Producto a elaborar</Label>
        <select id="producto" className={selectClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · en vitrina {p.current_stock}
            </option>
          ))}
        </select>
      </div>

      {producto && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-zinc-900 text-lg">Cantidad de tandas</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Rinde {producto.yield_portions} unidades por tanda</p>
            </div>
            <div className="flex items-center gap-4 border border-zinc-200 rounded-full px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={() => setTandas((t) => Math.max(1, t - 1))}
                className="min-h-9 min-w-9 flex items-center justify-center hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                aria-label="Quitar una tanda"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-sm w-6 text-center" aria-live="polite">{tandas}</span>
              <button
                type="button"
                onClick={() => setTandas((t) => Math.min(1000, t + 1))}
                className="min-h-9 min-w-9 flex items-center justify-center hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                aria-label="Agregar una tanda"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-zinc-100" />

          <div className="space-y-2 text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100/80">
            <p className="text-xs font-semibold text-zinc-500 mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Insumos que se descontarán
            </p>
            {requeridos.map((r) => (
              <div key={r.name} className="flex justify-between items-center text-xs">
                <span className="text-zinc-600">{r.name}</span>
                <span className={`font-medium ${r.falta ? 'text-red-600' : 'text-zinc-900'}`}>
                  {formatQuantity(r.requerido, r.base_unit)}
                  {r.falta && ` · solo hay ${formatQuantity(r.stock, r.base_unit)}`}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota">Nota (opcional)</Label>
            <Input id="nota" maxLength={300} value={nota} onChange={(e) => setNota(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
        Al confirmar, los insumos se descuentan de tu inventario y las unidades terminadas se suman al stock de venta.
      </p>

      {hayFaltantes && (
        <p role="alert" className="text-sm text-amber-800 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">
          No hay insumos suficientes para esta cantidad. Registra una compra o reduce las tandas.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-6 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-40 md:static md:bg-transparent md:border-none md:shadow-none md:p-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-sm font-medium text-zinc-500">Total a vitrina</span>
            <span className="text-4xl font-serif font-bold text-zinc-900">
              {unidades} <span className="text-base text-zinc-400 font-sans font-medium">unid.</span>
            </span>
          </div>
          <button
            type="submit"
            disabled={isPending || hayFaltantes || !producto}
            className="w-full min-h-14 bg-[#B83B5E] text-white font-semibold rounded-2xl shadow-lg hover:bg-rose-800 active:scale-[0.98] transition-all text-base disabled:opacity-60 disabled:active:scale-100"
          >
            {isPending ? 'Registrando...' : 'Registrar producción'}
          </button>
        </div>
      </div>
    </form>
  )
}
