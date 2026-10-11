'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useBusiness } from '@/components/business-provider'
import { formatMoney } from '@/lib/business'
import { closeCash } from './actions'
import { useConfirm } from '@/components/confirm-dialog'

export function CajaForm({ fecha, ventasEfectivo }: { fecha: string; ventasEfectivo: number }) {
  const router = useRouter()
  const confirmar = useConfirm()
  const { currency_symbol } = useBusiness()
  const [isPending, startTransition] = useTransition()
  const [fondo, setFondo] = useState('')
  const [contado, setContado] = useState('')
  const [nota, setNota] = useState('')
  const money = (v: number) => formatMoney(v, currency_symbol)

  const fondoNum = Number(fondo) || 0
  const esperado = Math.round((fondoNum + ventasEfectivo) * 100) / 100
  const hayContado = contado !== ''
  const diferencia = Math.round(((Number(contado) || 0) - esperado) * 100) / 100

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault()
    if (fondo === '' || !(Number(fondo) >= 0)) return toast.error('Escribe el fondo inicial (puede ser 0).')
    if (!hayContado || !(Number(contado) >= 0)) return toast.error('Escribe el efectivo que contaste en la caja.')
    
    const ok = await confirmar({
      title: 'Cerrar la caja',
      description: 'Al cerrar la caja el corte queda guardado y ya no se puede modificar.',
      confirmText: 'Cerrar caja',
      tone: 'danger',
    })

    if (!ok) return

    startTransition(async () => {
      const result = await closeCash({ date: fecha, opening_float: Number(fondo), cash_counted: Number(contado), note: nota })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Caja cerrada con éxito')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleCerrar} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5 print:hidden" noValidate>
      <h2 className="font-semibold text-zinc-900">Cerrar la caja de este día</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fondo" className="text-zinc-700 font-semibold">Fondo inicial ({currency_symbol})</Label>
          <Input id="fondo" type="number" inputMode="decimal" min="0" step="0.01" value={fondo} onChange={(e) => setFondo(e.target.value)} placeholder="ej. 20.00" className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contado" className="text-zinc-700 font-semibold">Efectivo contado ({currency_symbol})</Label>
          <Input id="contado" type="number" inputMode="decimal" min="0" step="0.01" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="ej. 85.50" className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
      </div>

      <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-zinc-600"><span>Fondo inicial</span><span>{money(fondoNum)}</span></div>
        <div className="flex justify-between text-zinc-600"><span>Ventas en efectivo</span><span>{money(ventasEfectivo)}</span></div>
        <div className="flex justify-between font-bold text-zinc-900 pt-1.5 border-t border-zinc-200"><span>Esperado en caja</span><span>{money(esperado)}</span></div>
      </div>

      {hayContado && (
        diferencia === 0 ? <Alert variant="success">La caja cuadra: no hay diferencia.</Alert>
        : diferencia < 0 ? <Alert variant="error">Faltan {money(Math.abs(diferencia))} en la caja.</Alert>
        : <Alert variant="warning">Sobran {money(diferencia)} en la caja.</Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nota" className="text-zinc-700 font-semibold">Nota (opcional)</Label>
        <Input id="nota" value={nota} maxLength={300} onChange={(e) => setNota(e.target.value)} placeholder="ej. se dio cambio de más a un cliente" className="h-10 focus-visible:ring-[#B83B5E]" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-[#B83B5E] text-white hover:bg-rose-800 h-11">
        {isPending ? <><Spinner /> Guardando...</> : 'Cerrar caja'}
      </Button>
    </form>
  )
}