'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, Power, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/status-badge'
import { useConfirm } from '@/components/confirm-dialog'

type Item = { id: string; label: string; active: boolean }
type Result = { error?: string; success?: true }

export function CatalogManager({
  title,
  description,
  items,
  addPlaceholder,
  create,
  rename,
  toggle,
  remove,
}: {
  title: string
  description: string
  items: Item[]
  addPlaceholder: string
  create: (label: string) => Promise<Result>
  rename: (id: string, label: string) => Promise<Result>
  toggle: (id: string, active: boolean) => Promise<Result>
  remove: (id: string) => Promise<Result>
}) {
  const router = useRouter()
  const confirmar = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [nuevo, setNuevo] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  function ejecutar(accion: () => Promise<Result>, mensajeOk: string, despues?: () => void) {
    startTransition(async () => {
      const result = await accion()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(mensajeOk)
      despues?.()
      router.refresh()
    })
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ejecutar(() => create(nuevo), 'Agregado con éxito', () => setNuevo(''))
        }}
        className="flex gap-2"
      >
        <Input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder={addPlaceholder} className="h-10 focus-visible:ring-[#B83B5E]" />
        <Button type="submit" disabled={isPending || !nuevo.trim()} className="bg-[#B83B5E] text-white hover:bg-rose-800">
          {isPending ? <><Spinner /> Guardando...</> : 'Agregar'}
        </Button>
      </form>

      <ul className="divide-y divide-zinc-100">
        {items.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">Todavía no hay registros.</li>}
        {items.map((item) => (
          <li key={item.id} className="py-3 flex items-center justify-between gap-3">
            {editando === item.id ? (
              <form
                className="flex flex-1 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  ejecutar(() => rename(item.id, texto), 'Nombre actualizado', () => setEditando(null))
                }}
              >
                <Input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} className="h-9 focus-visible:ring-[#B83B5E]" />
                <Button type="submit" size="sm" disabled={isPending || !texto.trim()} className="bg-[#B83B5E] text-white hover:bg-rose-800" title="Guardar nombre">
                  <Check className="w-4 h-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditando(null)} title="Cancelar">
                  <X className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium truncate ${item.active ? 'text-zinc-900' : 'text-zinc-400 line-through'}`}>{item.label}</span>
                  <StatusBadge status={item.active ? { tone: 'ok', label: 'Activo' } : { tone: 'info', label: 'Inactivo' }} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => { setEditando(item.id); setTexto(item.label) }} title="Editar nombre">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => ejecutar(() => toggle(item.id, !item.active), item.active ? 'Desactivado' : 'Activado')}
                    title={item.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      const ok = await confirmar({
                        title: `Borrar "${item.label}"`,
                        description: 'Si ya se usó en ventas o productos no se podrá borrar: en ese caso desactívalo.',
                        confirmText: 'Borrar',
                        tone: 'danger',
                      })
                      if (ok) ejecutar(() => remove(item.id), 'Borrado')
                    }}
                    title="Borrar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
