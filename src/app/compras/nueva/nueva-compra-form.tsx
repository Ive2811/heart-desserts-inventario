'use client'

import { useBusiness } from '@/components/business-provider'
import { Spinner } from '@/components/ui/spinner'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner' // <-- 1. Importamos la librería de alertas elegantes

export type InsumoOption = {
  id: string
  name: string
  base_unit: 'g' | 'ml' | 'unit'
  purchase_unit: string
  conversion_factor: number
  is_perishable: boolean
}

export type ProveedorOption = { id: string; name: string }

type Item = {
  ingredient_id: string
  quantity: number
  total_cost: number
  expires_on: string | null
}

type Line = {
  key: number
  ingredient_id: string
  quantity: string
  total_cost: string
  expires_on: string
}

const BASE_LABEL: Record<InsumoOption['base_unit'], string> = {
  g: 'g',
  ml: 'ml',
  unit: 'unidades',
}

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E] disabled:cursor-not-allowed disabled:opacity-50'

function formatNumber(value: number, maxDecimals = 3) {
  return new Intl.NumberFormat('es-SV', { maximumFractionDigits: maxDecimals }).format(value)
}

export function NuevaCompraForm({
  insumos,
  proveedores,
  today,
}: {
  insumos: InsumoOption[]
  proveedores: ProveedorOption[]
  today: string
}) {
  const { currency_symbol } = useBusiness()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const nextKey = useRef(2)

  const [supplierId, setSupplierId] = useState('')
  const [purchasedOn, setPurchasedOn] = useState(today)
  const [invoice, setInvoice] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { key: 1, ingredient_id: '', quantity: '', total_cost: '', expires_on: '' },
  ])

  const byId = new Map(insumos.map((i) => [i.id, i]))

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: nextKey.current++, ingredient_id: '', quantity: '', total_cost: '', expires_on: '' },
    ])
  }

  function removeLine(key: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev))
  }

  const total = lines.reduce((sum, l) => {
    const n = Number(l.total_cost)
    return Number.isFinite(n) && n > 0 ? sum + n : sum
  }, 0)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Validaciones personalizadas con Sonner (Alertas elegantes)
    if (!purchasedOn) {
      toast.error('Por favor, ingresa la fecha de la compra.')
      return
    }

    const items: Item[] = []
    for (const [index, l] of lines.entries()) {
      const quantity = Number(l.quantity)
      const total_cost = l.total_cost === '' ? NaN : Number(l.total_cost)
      
      if (!l.ingredient_id) {
        toast.error(`Falta seleccionar el insumo en la línea ${index + 1}.`)
        return
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error(`La cantidad en la línea ${index + 1} debe ser mayor a cero.`)
        return
      }
      if (!Number.isFinite(total_cost) || total_cost < 0) {
        toast.error(`Escribe el total pagado en la línea ${index + 1}.`)
        return
      }
      
      items.push({
        ingredient_id: l.ingredient_id,
        quantity,
        total_cost,
        expires_on: l.expires_on || null,
      })
    }

    startTransition(async () => {
      const result = await createPurchase({
        supplier_id: supplierId || null,
        purchased_on: purchasedOn,
        invoice,
        note,
        items,
      })
      
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      toast.success('¡Compra registrada exitosamente!')
      router.push('/compras')
    })
  }

  return (
    // 2. Agregamos "noValidate" al form para apagar las alertas nativas del navegador
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Datos Generales de la Compra */}
      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier" className="text-zinc-700 font-semibold">Proveedor</Label>
          <select id="supplier" className={selectClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchased_on" className="text-zinc-700 font-semibold">Fecha de compra</Label>
          <Input id="purchased_on" type="date" value={purchasedOn} max={today} onChange={(e) => setPurchasedOn(e.target.value)} className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice" className="text-zinc-700 font-semibold">N.º de factura (opcional)</Label>
          <Input id="invoice" maxLength={60} value={invoice} onChange={(e) => setInvoice(e.target.value)} className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note" className="text-zinc-700 font-semibold">Nota (opcional)</Label>
          <Input id="note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className="h-10 focus-visible:ring-[#B83B5E]" />
        </div>
      </div>

      {/* Líneas de Insumos */}
      <div className="space-y-4">
        {lines.map((line, index) => {
          const insumo = byId.get(line.ingredient_id)
          const qty = Number(line.quantity)
          const cost = Number(line.total_cost)
          const baseQty = insumo && qty > 0 ? qty * insumo.conversion_factor : 0
          return (
            <div key={line.key} className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-zinc-900">Insumo {index + 1}</h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.key)} disabled={lines.length === 1} className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                  Quitar
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor={`ing-${line.key}`} className="text-zinc-700 font-semibold">Insumo</Label>
                  <select
                    id={`ing-${line.key}`}
                    className={selectClass}
                    value={line.ingredient_id}
                    onChange={(e) => updateLine(line.key, { ingredient_id: e.target.value, expires_on: '' })}
                  >
                    <option value="">Selecciona un insumo</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`qty-${line.key}`} className="text-zinc-700 font-semibold">
                    Cantidad comprada{insumo ? ` (${insumo.purchase_unit})` : ''}
                  </Label>
                  <Input
                    id={`qty-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    className="h-10 focus-visible:ring-[#B83B5E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`cost-${line.key}`} className="text-zinc-700 font-semibold">Total pagado ({currency_symbol})</Label>
                  <Input
                    id={`cost-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={line.total_cost}
                    onChange={(e) => updateLine(line.key, { total_cost: e.target.value })}
                    className="h-10 focus-visible:ring-[#B83B5E]"
                  />
                </div>

                {insumo?.is_perishable && (
                  <div className="space-y-2">
                    <Label htmlFor={`exp-${line.key}`} className="text-zinc-700 font-semibold">Vence (opcional)</Label>
                    <Input
                      id={`exp-${line.key}`}
                      type="date"
                      min={today}
                      value={line.expires_on}
                      onChange={(e) => updateLine(line.key, { expires_on: e.target.value })}
                      className="h-10 focus-visible:ring-[#B83B5E]"
                    />
                  </div>
                )}
              </div>

              {insumo && baseQty > 0 && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-sm text-zinc-600">
                    Entra al inventario: <span className="font-semibold text-zinc-900">{formatNumber(baseQty)} {BASE_LABEL[insumo.base_unit]}</span>
                    {cost > 0 && (
                      <>
                        {' '}· costo por {insumo.base_unit === 'unit' ? 'unidad' : insumo.base_unit}:{' '}
                        <span className="font-semibold text-[#B83B5E]">{currency_symbol}{formatNumber(cost / baseQty, 4)}</span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <Button type="button" variant="outline" onClick={addLine} className="w-full border-dashed border-2 hover:bg-zinc-50 hover:text-[#B83B5E] hover:border-rose-200 transition-colors">
          + Agregar otro insumo
        </Button>
      </div>

      {/* Pie con Total y Botón Guardar */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <div className="text-lg text-zinc-700">
          Total de la compra: <span className="font-serif font-bold text-2xl text-zinc-900 ml-2">{currency_symbol}{total.toFixed(2)}</span>
        </div>
        <Button type="submit" disabled={isPending} className="w-full md:w-auto bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">
          {isPending ? <><Spinner /> Guardando...</> : 'Guardar compra'}
        </Button>
      </div>
    </form>
  )
}