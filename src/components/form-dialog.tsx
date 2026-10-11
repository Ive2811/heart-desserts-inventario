'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Result = { error?: string; success?: true }

// Diálogo con formulario para editar un registro. Los campos (children) usan name="..." y
// llegan a la acción de servidor como FormData. Mientras guarda, el botón se deshabilita.
export function FormDialog({
  title,
  description,
  triggerLabel = 'Editar',
  submitText = 'Guardar cambios',
  successMessage = 'Cambios guardados',
  action,
  children,
}: {
  title: string
  description?: string
  triggerLabel?: string
  submitText?: string
  successMessage?: string
  action: (formData: FormData) => Promise<Result>
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success(successMessage)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} className="text-zinc-600 hover:text-[#B83B5E] gap-1.5">
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (pending) return
          setOpen(value)
          if (!value) setError(null)
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={submit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-bold text-zinc-900">{title}</DialogTitle>
              {description && <DialogDescription className="text-sm text-zinc-600">{description}</DialogDescription>}
            </DialogHeader>

            <div className="grid gap-4">{children}</div>

            {error && (
              <p role="alert" className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)} className="bg-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="bg-[#B83B5E] text-white hover:bg-rose-800 border-none">
                {pending ? (
                  <>
                    <Spinner /> Guardando...
                  </>
                ) : (
                  submitText
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
