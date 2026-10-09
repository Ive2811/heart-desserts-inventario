'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

    const items: Item[] = []
    for (const [index, l] of lines.entries()) {
      const quantity = Number(l.quantity)
      const total_cost = l.total_cost === '' ? NaN : Number(l.total_cost)
      if (!l.ingredient_id) return setError(`Línea ${index + 1}: elige un insumo`)
      if (!Number.isFinite(quantity) || quantity <= 0) return setError(`Línea ${index + 1}: la cantidad debe ser mayor que cero`)
      if (!Number.isFinite(total_cost) || total_cost < 0) return setError(`Línea ${index + 1}: escribe el costo total pagado`)
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
        setError(result.error)
        return
      }
      router.push('/compras')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border rounded-xl bg-white shadow-sm p-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor</Label>
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
          <Label htmlFor="purchased_on">Fecha de compra</Label>
          <Input id="purchased_on" type="date" required value={purchasedOn} max={today} onChange={(e) => setPurchasedOn(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice">N.º de factura (opcional)</Label>
          <Input id="invoice" maxLength={60} value={invoice} onChange={(e) => setInvoice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Nota (opcional)</Label>
          <Input id="note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4">
        {lines.map((line, index) => {
          const insumo = byId.get(line.ingredient_id)
          const qty = Number(line.quantity)
          const cost = Number(line.total_cost)
          const baseQty = insumo && qty > 0 ? qty * insumo.conversion_factor : 0
          return (
            <div key={line.key} className="border rounded-xl bg-white shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Insumo {index + 1}</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => removeLine(line.key)} disabled={lines.length === 1}>
                  Quitar
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor={`ing-${line.key}`}>Insumo</Label>
                  <select
                    id={`ing-${line.key}`}
                    className={selectClass}
                    value={line.ingredient_id}
                    onChange={(e) => updateLine(line.key, { ingredient_id: e.target.value, expires_on: '' })}
                    required
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
                  <Label htmlFor={`qty-${line.key}`}>
                    Cantidad comprada{insumo ? ` (${insumo.purchase_unit})` : ''}
                  </Label>
                  <Input
                    id={`qty-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`cost-${line.key}`}>Total pagado ($)</Label>
                  <Input
                    id={`cost-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    required
                    value={line.total_cost}
                    onChange={(e) => updateLine(line.key, { total_cost: e.target.value })}
                  />
                </div>

                {insumo?.is_perishable && (
                  <div className="space-y-2">
                    <Label htmlFor={`exp-${line.key}`}>Vence (opcional)</Label>
                    <Input
                      id={`exp-${line.key}`}
                      type="date"
                      min={today}
                      value={line.expires_on}
                      onChange={(e) => updateLine(line.key, { expires_on: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {insumo && baseQty > 0 && (
                <p className="text-sm text-zinc-500">
                  Entra al inventario: <span className="font-semibold">{formatNumber(baseQty)} {BASE_LABEL[insumo.base_unit]}</span>
                  {cost > 0 && (
                    <>
                      {' '}· costo por {insumo.base_unit === 'unit' ? 'unidad' : insumo.base_unit}:{' '}
                      <span className="font-semibold">${formatNumber(cost / baseQty, 4)}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          )
        })}

        <Button type="button" variant="outline" onClick={addLine}>
          + Agregar otro insumo
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex justify-between items-center border-t pt-4">
        <div className="text-lg">
          Total de la compra: <span className="font-bold">${total.toFixed(2)}</span>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar compra'}
        </Button>
      </div>
    </form>
  )
}
