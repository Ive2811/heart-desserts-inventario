'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ConfirmOptions = {
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  // "danger" para acciones que no se pueden deshacer (anular, borrar, cerrar caja)
  tone?: 'default' | 'danger'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

// Uso:  const confirmar = useConfirm()
//       if (!(await confirmar({ title: 'Cerrar la caja', description: '...', tone: 'danger' }))) return
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  return confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Si ya hay uno abierto se cancela, para no dejar promesas colgadas
    resolver.current?.(false)
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function close(result: boolean) {
    resolver.current?.(result)
    resolver.current = null
    setOptions(null)
  }

  const danger = options?.tone === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md" role="alertdialog">
          <DialogHeader className="items-start gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                danger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {danger ? <AlertTriangle className="w-5 h-5" aria-hidden="true" /> : <HelpCircle className="w-5 h-5" aria-hidden="true" />}
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-zinc-900">{options?.title}</DialogTitle>
            {options?.description && (
              <DialogDescription className="text-sm text-zinc-600 leading-relaxed">{options.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} className="bg-white">
              {options?.cancelText ?? 'Cancelar'}
            </Button>
            <Button
              type="button"
              autoFocus
              onClick={() => close(true)}
              className={`border-none text-white ${danger ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#B83B5E] hover:bg-rose-800'}`}
            >
              {options?.confirmText ?? 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
