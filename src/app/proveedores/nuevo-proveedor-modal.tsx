'use client'

import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { createSupplier } from './actions'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
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
      {/* Botón que abre el modal (Corregido para evitar el error de TypeScript) */}
      <DialogTrigger render={
        <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors shadow-sm border-none">
          Agregar proveedor
        </Button>
      } />
      
      {/* Contenido del Modal */}
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border border-zinc-200 p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">Registrar nuevo proveedor</DialogTitle>
          <DialogDescription className="text-zinc-500 mt-1">
            Podrás elegirlo al registrar tus compras.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-700 font-semibold">Nombre</Label>
            <Input id="name" name="name" maxLength={120} placeholder="ej. Distribuidora La Esperanza" required className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-700 font-semibold">Teléfono (opcional)</Label>
            <Input id="phone" name="phone" maxLength={30} inputMode="tel" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-700 font-semibold">Nota (opcional)</Label>
            <Input id="notes" name="notes" maxLength={300} placeholder="ej. entrega los martes" className="h-10 focus-visible:ring-[#B83B5E]" />
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="hover:bg-zinc-50 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">
              {loading ? <><Spinner /> Guardando...</> : 'Guardar proveedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}