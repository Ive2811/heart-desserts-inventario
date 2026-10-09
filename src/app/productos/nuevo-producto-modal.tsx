'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E] disabled:cursor-not-allowed disabled:opacity-50'

export function NuevoProductoModal({ categorias }: { categorias: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fulfillment, setFulfillment] = useState('made_to_order')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    
    // Validaciones personalizadas
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    
    if (!name.trim()) {
      toast.error('El nombre del producto no puede estar vacío.')
      return
    }

    setLoading(true)
    const result = await createProduct(new FormData(form))
    setLoading(false)

    if ('error' in result && result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Producto creado. Vamos a armar la receta.')
    form.reset()
    setOpen(false)
    if ('id' in result && result.id) {
      router.push(`/productos/${result.id}`)
    } else {
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors shadow-sm border-none">
          Agregar producto
        </Button>
      } />
      
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border border-zinc-200 p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">Registrar nuevo producto</DialogTitle>
          <DialogDescription className="text-zinc-500 mt-1">
            Al guardar, pasarás a definir su receta.
          </DialogDescription>
        </DialogHeader>
        
        {/* Usamos noValidate para apagar las alertas nativas */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-700 font-semibold">Nombre del producto</Label>
            <Input id="name" name="name" maxLength={120} placeholder="ej. Crepa de Nutella" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id" className="text-zinc-700 font-semibold">Categoría</Label>
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
            <Label htmlFor="sale_price" className="text-zinc-700 font-semibold">Precio de venta ($)</Label>
            <Input id="sale_price" name="sale_price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Opcional" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment" className="text-zinc-700 font-semibold">¿Cómo se elabora?</Label>
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
            <p className="text-xs text-zinc-500 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              {fulfillment === 'made_to_order'
                ? 'Los insumos se descuentan en el momento de la venta.'
                : 'Los insumos se descuentan al registrar la tanda y la venta baja el stock del producto.'}
            </p>
          </div>

          {fulfillment === 'made_to_stock' && (
            <div className="space-y-2">
              <Label htmlFor="min_stock" className="text-zinc-700 font-semibold">Stock mínimo de alerta (porciones)</Label>
              <Input id="min_stock" name="min_stock" type="number" min="0" step="1" defaultValue="0" className="h-10 focus-visible:ring-[#B83B5E]" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="hover:bg-zinc-50 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">
              {loading ? 'Guardando...' : 'Guardar y definir receta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}