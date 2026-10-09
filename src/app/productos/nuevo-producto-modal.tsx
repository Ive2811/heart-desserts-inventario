'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function NuevoProductoModal({ categorias }: { categorias: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState('made_to_order')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError(null)

    const result = await createProduct(new FormData(form))
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    form.reset()
    setOpen(false)
    router.push(`/productos/${result.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Agregar Producto</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Producto</DialogTitle>
          <DialogDescription>Al guardar, pasarás a definir su receta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del producto</Label>
            <Input id="name" name="name" maxLength={120} placeholder="ej. Crepa de Nutella" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Categoría</Label>
            <select id="category_id" name="category_id" className={selectClass} defaultValue="">
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_price">Precio de venta ($)</Label>
            <Input id="sale_price" name="sale_price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment">¿Cómo se elabora?</Label>
            <select
              id="fulfillment"
              name="fulfillment"
              className={selectClass}
              value={fulfillment}
              onChange={(e) => setFulfillment(e.target.value)}
            >
              <option value="made_to_order">Por encargo (al vender)</option>
              <option value="made_to_stock">Por tanda (se produce y luego se vende)</option>
            </select>
            <p className="text-xs text-zinc-500">
              {fulfillment === 'made_to_order'
                ? 'Los insumos se descuentan en el momento de la venta.'
                : 'Los insumos se descuentan al registrar la tanda y la venta baja el stock del producto.'}
            </p>
          </div>

          {fulfillment === 'made_to_stock' && (
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock mínimo de alerta (porciones)</Label>
              <Input id="min_stock" name="min_stock" type="number" min="0" step="1" defaultValue="0" />
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y definir receta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
