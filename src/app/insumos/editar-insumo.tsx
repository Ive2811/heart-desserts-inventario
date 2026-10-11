'use client'

import { FormDialog } from '@/components/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateIngredient } from './editar-actions'

export type InsumoEditable = {
  id: string
  name: string
  min_stock: number
  purchase_unit: string
  conversion_factor: number
  is_perishable: boolean
  active: boolean
}

export function EditarInsumo({ insumo }: { insumo: InsumoEditable }) {
  return (
    <FormDialog
      title={`Editar ${insumo.name}`}
      description="La unidad base no se puede cambiar porque afectaría el stock y los costos ya registrados."
      action={updateIngredient}
    >
      <input type="hidden" name="id" value={insumo.id} />
      <div className="space-y-2">
        <Label htmlFor={`n-${insumo.id}`}>Nombre del insumo</Label>
        <Input id={`n-${insumo.id}`} name="name" defaultValue={insumo.name} maxLength={120} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`m-${insumo.id}`}>Stock mínimo de alerta (en unidad base)</Label>
        <Input id={`m-${insumo.id}`} name="min_stock" type="number" min="0" step="any" inputMode="decimal" defaultValue={insumo.min_stock} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`u-${insumo.id}`}>Unidad de compra</Label>
          <Input id={`u-${insumo.id}`} name="purchase_unit" defaultValue={insumo.purchase_unit} maxLength={30} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`c-${insumo.id}`}>Equivale a (unidad base)</Label>
          <Input id={`c-${insumo.id}`} name="conversion_factor" type="number" min="0" step="any" defaultValue={insumo.conversion_factor} required />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-zinc-700 min-h-9">
        <input type="checkbox" name="is_perishable" defaultChecked={insumo.is_perishable} className="accent-[#B83B5E] w-5 h-5" />
        Es perecedero (pedirá fecha de vencimiento al comprar)
      </label>
      <label className="flex items-center gap-2.5 text-sm text-zinc-700 min-h-9">
        <input type="checkbox" name="active" defaultChecked={insumo.active} className="accent-[#B83B5E] w-5 h-5" />
        Activo (si lo desmarcas deja de aparecer en compras y recetas)
      </label>
    </FormDialog>
  )
}
