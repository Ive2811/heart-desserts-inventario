'use client'

import { useState } from 'react'
import { createSupplier } from './actions'
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

export function NuevoProveedorModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError(null)

    const result = await createSupplier(new FormData(form))
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Agregar Proveedor</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
          <DialogDescription>Podrás elegirlo al registrar tus compras.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" maxLength={120} placeholder="ej. Distribuidora La Esperanza" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" name="phone" maxLength={30} inputMode="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Input id="notes" name="notes" maxLength={300} placeholder="ej. entrega los martes" />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
