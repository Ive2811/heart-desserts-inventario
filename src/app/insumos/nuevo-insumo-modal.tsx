'use client'

import { useState } from 'react'
import { createIngredient } from './actions'
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
} from "@/components/ui/dialog"

export function NuevoInsumoModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError(null)
    
    const result = await createIngredient(new FormData(form))
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    form.reset()
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Agregar Insumo</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Insumo</DialogTitle>
          <DialogDescription>
            Agrega materia prima al catálogo general de Heart Desserts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Insumo</Label>
            <Input id="name" name="name" placeholder="ej. Queso Crema" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_unit">Unidad Base</Label>
            <select
              id="base_unit"
              name="base_unit"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unit">Unidades (unit)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_unit">Unidad de compra (opcional)</Label>
            <Input id="purchase_unit" name="purchase_unit" maxLength={30} placeholder="ej. bolsa, caja, paquete" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion_factor">Una unidad de compra equivale a (en unidad base)</Label>
            <Input defaultValue="1" id="conversion_factor" name="conversion_factor" min="0" step="any" type="number" />
            <p className="text-xs text-zinc-500">Ej.: 1 bolsa = 1000 g, escribe 1000. Si no usas unidad de compra, déjalo en 1.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_stock">Stock Mínimo de Alerta</Label>
            <Input defaultValue="0" id="min_stock" name="min_stock" required step="0.001" type="number" />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Insumo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}