'use client'

import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { createIngredient } from './actions'
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
} from "@/components/ui/dialog"

export function NuevoInsumoModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    
    // Validaciones personalizadas
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const min_stock = (form.elements.namedItem('min_stock') as HTMLInputElement).value
    const base_unit = (form.elements.namedItem('base_unit') as HTMLSelectElement).value

    if (!name.trim()) {
      toast.error('El nombre del insumo no puede estar vacío.')
      return
    }
    
    if (!base_unit) {
      toast.error('Por favor, selecciona una unidad base (g, ml o unid).')
      return
    }

    if (Number(min_stock) < 0) {
      toast.error('El stock mínimo no puede ser un número negativo.')
      return
    }

    setLoading(true)
    const result = await createIngredient(new FormData(form))
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success('¡Insumo registrado con éxito!')
    form.reset()
    setOpen(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors shadow-sm border-none">
          Agregar insumo
        </Button>
      } />
      
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border border-zinc-200 p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">Registrar nuevo insumo</DialogTitle>
          <DialogDescription className="text-zinc-500 mt-1">
            Agrega materia prima al catálogo general de Heart Desserts.
          </DialogDescription>
        </DialogHeader>
        
        {/* Usamos noValidate para apagar las alertas nativas */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-700 font-semibold">Nombre del insumo</Label>
            <Input id="name" name="name" placeholder="ej. queso crema" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_unit" className="text-zinc-700 font-semibold">Unidad base</Label>
            <select
              id="base_unit"
              name="base_unit"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]"
            >
              <option value="">Selecciona la unidad</option>
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unit">Unidades (unid)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_unit" className="text-zinc-700 font-semibold">Unidad de compra (opcional)</Label>
            <Input id="purchase_unit" name="purchase_unit" maxLength={30} placeholder="ej. bolsa, caja, paquete" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion_factor" className="text-zinc-700 font-semibold">Una unidad equivale a (en unidad base)</Label>
            <Input defaultValue="1" id="conversion_factor" name="conversion_factor" min="0" step="any" type="number" className="h-10 focus-visible:ring-[#B83B5E]" />
            <p className="text-xs text-zinc-500 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              Ej.: 1 bolsa = 1000 g, escribe 1000. Si no usas unidad de compra, déjalo en 1.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_stock" className="text-zinc-700 font-semibold">Stock mínimo de alerta</Label>
            <Input defaultValue="0" id="min_stock" name="min_stock" min="0" step="0.001" type="number" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-zinc-700 cursor-pointer select-none">
            <input type="checkbox" name="is_perishable" className="accent-[#B83B5E] w-4 h-4 rounded border-zinc-300 cursor-pointer" />
            <span>Es perecedero (pedir fecha de vencimiento al comprarlo)</span>
          </label>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="hover:bg-zinc-50 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">
              {loading ? <><Spinner /> Guardando...</> : 'Guardar insumo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}