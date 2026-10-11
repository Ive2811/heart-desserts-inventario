'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { applyPhysicalCount } from './actions'
import { useConfirm } from '@/components/confirm-dialog'
import { UNIT_LABEL } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Insumo = { id: string; name: string; base_unit: string; stock: number }

function normalizar(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const nf = new Intl.NumberFormat('es-SV', { maximumFractionDigits: 3 })

export function ConteoForm({ insumos }: { insumos: Insumo[] }) {
  const router = useRouter()
  const confirmar = useConfirm()
  const [pending, startTransition] = useTransition()
  const [conteos, setConteos] = useState<Record<string, string>>({})
  const [busqueda, setBusqueda] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Solo cuentan los insumos con un conteo escrito que sea distinto al stock del sistema
  const cambios = insumos
    .map((i) => {
      const texto = conteos[i.id]
      if (texto === undefined || texto === '') return null
      const contado = Number(texto)
      if (!Number.isFinite(contado) || contado < 0) return null
      const diferencia = Math.round((contado - i.stock) * 1000) / 1000
      return diferencia === 0 ? null : { insumo: i, contado, diferencia }
    })
    .filter((c): c is { insumo: Insumo; contado: number; diferencia: number } => c !== null)

  const invalidos = insumos.filter((i) => {
    const texto = conteos[i.id]
    if (texto === undefined || texto === '') return false
    const n = Number(texto)
    return !Number.isFinite(n) || n < 0
  })

  const visibles = insumos.filter((i) => normalizar(i.name).includes(normalizar(busqueda.trim())))

  async function aplicar() {
    setError(null)
    if (invalidos.length > 0) return setError('Hay conteos negativos o no válidos: corrígelos antes de aplicar.')
    if (cambios.length === 0) return setError('No hay diferencias: el conteo coincide con el sistema.')

    const ok = await confirmar({
      title: 'Aplicar el conteo físico',
      description: `Se ajustará el stock de ${cambios.length} ${cambios.length === 1 ? 'insumo' : 'insumos'} para que coincida con lo contado. Cada ajuste quedará en el kardex y no se puede deshacer.`,
      confirmText: 'Aplicar ajustes',
      tone: 'danger',
    })
    if (!ok) return

    startTransition(async () => {
      const result = await applyPhysicalCount({
        items: cambios.map((c) => ({ ingredient_id: c.insumo.id, counted: c.contado })),
        note: nota,
      })
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(`Inventario ajustado: ${result.changed} ${result.changed === 1 ? 'insumo' : 'insumos'}`)
      setConteos({})
      setNota('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="buscar">Buscar insumo</Label>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <Input id="buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Escribe para filtrar la lista" className="h-10 pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota del conteo (opcional)</Label>
          <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} placeholder="ej. conteo de cierre de mes" className="h-10" />
        </div>
      </div>

      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Insumo</TableHead>
              <TableHead className="text-right font-semibold text-zinc-700">En el sistema</TableHead>
              <TableHead className="font-semibold text-zinc-700 w-44">Conteo real</TableHead>
              <TableHead className="text-right font-semibold text-zinc-700">Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length > 0 ? (
              visibles.map((i) => {
                const texto = conteos[i.id] ?? ''
                const contado = texto === '' ? null : Number(texto)
                const valido = contado !== null && Number.isFinite(contado) && contado >= 0
                const diferencia = valido ? Math.round((contado - i.stock) * 1000) / 1000 : null
                return (
                  <TableRow key={i.id} className="hover:bg-zinc-50/50">
                    <TableCell className="font-medium text-zinc-900">{i.name}</TableCell>
                    <TableCell className="text-right text-sm text-zinc-600 tabular-nums">
                      {nf.format(i.stock)} {UNIT_LABEL[i.base_unit] ?? i.base_unit}
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Conteo real de ${i.name}`}
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={texto}
                        onChange={(e) => setConteos((prev) => ({ ...prev, [i.id]: e.target.value }))}
                        aria-invalid={texto !== '' && !valido}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {diferencia === null ? (
                        <span className="text-zinc-300">—</span>
                      ) : diferencia === 0 ? (
                        <span className="text-emerald-700">Coincide</span>
                      ) : (
                        <span className={diferencia > 0 ? 'text-sky-700' : 'text-rose-700'}>
                          {diferencia > 0 ? '+' : ''}
                          {nf.format(diferencia)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-zinc-500 text-sm">
                  Ningún insumo coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-5 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            <span className="font-serif font-bold text-xl text-zinc-900">{cambios.length}</span>{' '}
            {cambios.length === 1 ? 'diferencia por ajustar' : 'diferencias por ajustar'}
          </p>
          <Button
            type="button"
            onClick={aplicar}
            disabled={pending || cambios.length === 0}
            className="bg-[#B83B5E] text-white hover:bg-rose-800 border-none min-h-11 px-6"
          >
            {pending ? (
              <>
                <Spinner /> Aplicando...
              </>
            ) : (
              'Aplicar conteo'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
