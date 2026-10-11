'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Botón que abre un diálogo formal pidiendo un motivo y ejecuta una acción (anular venta, reabrir día)
export function ReasonDialogButton({
  triggerText,
  triggerVariant = 'outline',
  title,
  description,
  confirmText,
  pendingText,
  successMessage,
  action,
}: {
  triggerText: string
  triggerVariant?: 'outline' | 'default'
  title: string
  description: string
  confirmText: string
  pendingText: string
  successMessage: string
  action: (reason: string) => Promise<{ error?: string; success?: true }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await action(reason)
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success(successMessage)
      setOpen(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <>
      <Button type="button" size="sm" variant={triggerVariant} onClick={() => setOpen(true)} className={triggerVariant === 'outline' ? 'bg-white' : 'bg-[#B83B5E] text-white hover:bg-rose-800 border-none'}>
        {triggerText}
      </Button>
      <Dialog open={open} onOpenChange={(value) => !pending && setOpen(value)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-bold text-zinc-900">{title}</DialogTitle>
              <DialogDescription className="text-sm text-zinc-600 leading-relaxed">{description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                placeholder="ej. error al digitar el producto"
                required
                autoFocus
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)} className="bg-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="bg-rose-700 text-white hover:bg-rose-800 border-none">
                {pending ? (
                  <>
                    <Spinner /> {pendingText}
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
