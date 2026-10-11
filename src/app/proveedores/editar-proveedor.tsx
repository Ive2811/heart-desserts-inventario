'use client'

import { FormDialog } from '@/components/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSupplier } from './editar-actions'

export type ProveedorEditable = { id: string; name: string; phone: string | null; notes: string | null; active: boolean }

export function EditarProveedor({ proveedor }: { proveedor: ProveedorEditable }) {
  return (
    <FormDialog title={`Editar ${proveedor.name}`} action={updateSupplier}>
      <input type="hidden" name="id" value={proveedor.id} />
      <div className="space-y-2">
        <Label htmlFor={`sn-${proveedor.id}`}>Nombre</Label>
        <Input id={`sn-${proveedor.id}`} name="name" defaultValue={proveedor.name} maxLength={120} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`sp-${proveedor.id}`}>Teléfono (opcional)</Label>
        <Input id={`sp-${proveedor.id}`} name="phone" defaultValue={proveedor.phone ?? ''} maxLength={30} inputMode="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`st-${proveedor.id}`}>Nota (opcional)</Label>
        <Input id={`st-${proveedor.id}`} name="notes" defaultValue={proveedor.notes ?? ''} maxLength={300} />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-zinc-700 min-h-9">
        <input type="checkbox" name="active" defaultChecked={proveedor.active} className="accent-[#B83B5E] w-5 h-5" />
        Activo (si lo desmarcas deja de aparecer al registrar compras)
      </label>
    </FormDialog>
  )
}
