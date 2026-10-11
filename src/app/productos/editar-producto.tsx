'use client'

import { FormDialog } from '@/components/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProduct } from './editar-actions'

export type ProductoEditable = {
  id: string
  name: string
  category_id: string | null
  sale_price: number | null
  min_stock: number
  active: boolean
  porTanda: boolean
}

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'

export function EditarProducto({ producto, categorias }: { producto: ProductoEditable; categorias: { id: string; name: string }[] }) {
  return (
    <FormDialog
      title={`Editar ${producto.name}`}
      description="Los cambios de precio no alteran las ventas ya registradas: cada venta conserva el precio y el costo de ese momento."
      action={updateProduct}
    >
      <input type="hidden" name="id" value={producto.id} />
      <div className="space-y-2">
        <Label htmlFor={`pn-${producto.id}`}>Nombre del producto</Label>
        <Input id={`pn-${producto.id}`} name="name" defaultValue={producto.name} maxLength={120} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`pc-${producto.id}`}>Categoría</Label>
        <select id={`pc-${producto.id}`} name="category_id" defaultValue={producto.category_id ?? ''} className={selectClass}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`pp-${producto.id}`}>Precio de venta</Label>
          <Input id={`pp-${producto.id}`} name="sale_price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={producto.sale_price ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`ps-${producto.id}`}>Stock mínimo (unid.)</Label>
          <Input id={`ps-${producto.id}`} name="min_stock" type="number" min="0" step="1" defaultValue={producto.min_stock} disabled={!producto.porTanda} />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-zinc-700 min-h-9">
        <input type="checkbox" name="active" defaultChecked={producto.active} className="accent-[#B83B5E] w-5 h-5" />
        Activo (si lo desmarcas deja de aparecer al registrar ventas)
      </label>
    </FormDialog>
  )
}
