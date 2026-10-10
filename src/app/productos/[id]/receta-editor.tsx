'use client'

import { useBusiness } from '@/components/business-provider'
import { Spinner } from '@/components/ui/spinner'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveRecipe } from '../actions'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type BaseUnit = 'g' | 'ml' | 'unit'

type Insumo = { id: string; name: string; base_unit: BaseUnit; avg_cost: number }

type Inicial = {
  yield_portions: number
  notes: string
  items: { ingredient_id: string; quantity: number; waste_pct: number }[]
}

type Item = { ingredient_id: string; quantity: number; waste_pct: number }

type Line = { key: number; ingredient_id: string; quantity: string; waste_pct: string }

const UNIT_LABEL: Record<BaseUnit, string> = { g: 'g', ml: 'ml', unit: 'unidades' }

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E] disabled:cursor-not-allowed disabled:opacity-50'

function moneyWith(symbol: string, value: number, decimals = 2) {
  return `${symbol}${new Intl.NumberFormat('es-SV', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`
}

export function RecetaEditor({
  productoId,
  precio,
  insumos,
  inicial,
}: {
  productoId: string
  precio: number | null
  insumos: Insumo[]
  inicial: Inicial | null
}) {
  const { currency_symbol } = useBusiness()
  const money = (value: number, decimals = 2) => moneyWith(currency_symbol, value, decimals)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialLines: Line[] =
    inicial && inicial.items.length > 0
      ? inicial.items.map((it, index) => ({
          key: index + 1,
          ingredient_id: it.ingredient_id,
          quantity: String(it.quantity),
          waste_pct: String(it.waste_pct),
        }))
      : [{ key: 1, ingredient_id: '', quantity: '', waste_pct: '0' }]

  const nextKey = useRef(initialLines.length + 1)
  const [yieldPortions, setYieldPortions] = useState(String(inicial?.yield_portions ?? 1))
  const [notes, setNotes] = useState(inicial?.notes ?? '')
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const byId = new Map(insumos.map((i) => [i.id, i]))
  const usados = new Set(lines.map((l) => l.ingredient_id).filter(Boolean))

  function updateLine(key: number, patch: Partial<Line>) {
    setSaved(false)
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setSaved(false)
    setLines((prev) => [...prev, { key: nextKey.current++, ingredient_id: '', quantity: '', waste_pct: '0' }])
  }

  function removeLine(key: number) {
    setSaved(false)
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev))
  }

  // Costos en vivo
  const portions = Number(yieldPortions)
  const lineCost = (l: Line) => {
    const insumo = byId.get(l.ingredient_id)
    const qty = Number(l.quantity)
    const waste = Number(l.waste_pct) || 0
    if (!insumo || !(qty > 0)) return 0
    return qty * (1 + waste / 100) * insumo.avg_cost
  }
  const totalCost = lines.reduce((sum, l) => sum + lineCost(l), 0)
  const unitCost = portions > 0 ? totalCost / portions : 0
  const margin = precio !== null && precio > 0 && unitCost > 0 ? ((precio - unitCost) / precio) * 100 : null
  const sinCosto = lines.some((l) => byId.get(l.ingredient_id) && byId.get(l.ingredient_id)!.avg_cost === 0)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!Number.isInteger(portions) || portions < 1) {
      return setError('La receta debe rendir un número entero de porciones (mínimo 1)')
    }

    const items: Item[] = []
    for (const [index, l] of lines.entries()) {
      const quantity = Number(l.quantity)
      const waste_pct = l.waste_pct === '' ? 0 : Number(l.waste_pct)
      if (!l.ingredient_id) return setError(`Línea ${index + 1}: elige un ingrediente`)
      if (!Number.isFinite(quantity) || quantity <= 0) return setError(`Línea ${index + 1}: la cantidad debe ser mayor que cero`)
      if (!Number.isFinite(waste_pct) || waste_pct < 0 || waste_pct > 100) {
        return setError(`Línea ${index + 1}: el desperdicio debe estar entre 0 y 100`)
      }
      items.push({ ingredient_id: l.ingredient_id, quantity, waste_pct })
    }

    startTransition(async () => {
      const result = await saveRecipe({ product_id: productoId, yield_portions: portions, notes, items })
      if (result.error) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos Principales */}
      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="yield" className="text-zinc-700 font-semibold">¿Cuántas porciones rinde la receta?</Label>
          <Input
            id="yield"
            type="number"
            min="1"
            step="1"
            required
            value={yieldPortions}
            onChange={(e) => {
              setSaved(false)
              setYieldPortions(e.target.value)
            }}
            className="h-10 focus-visible:ring-[#B83B5E]"
          />
          <p className="text-xs text-zinc-500">Escribe las cantidades para toda la receta; el sistema divide entre las porciones.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-zinc-700 font-semibold">Nota (opcional)</Label>
          <Input
            id="notes"
            maxLength={500}
            value={notes}
            onChange={(e) => {
              setSaved(false)
              setNotes(e.target.value)
            }}
            className="h-10 focus-visible:ring-[#B83B5E]"
          />
        </div>
      </div>

      {/* Líneas de Ingredientes */}
      <div className="space-y-4">
        {lines.map((line, index) => {
          const insumo = byId.get(line.ingredient_id)
          return (
            <div key={line.key} className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-zinc-900">Ingrediente {index + 1}</h2>
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
                    onChange={(e) => updateLine(line.key, { ingredient_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un insumo</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id} disabled={usados.has(i.id) && i.id !== line.ingredient_id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`qty-${line.key}`} className="text-zinc-700 font-semibold">Cantidad{insumo ? ` (${UNIT_LABEL[insumo.base_unit]})` : ''}</Label>
                  <Input
                    id={`qty-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    className="h-10 focus-visible:ring-[#B83B5E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`waste-${line.key}`} className="text-zinc-700 font-semibold">Desperdicio (%)</Label>
                  <Input
                    id={`waste-${line.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="any"
                    value={line.waste_pct}
                    onChange={(e) => updateLine(line.key, { waste_pct: e.target.value })}
                    className="h-10 focus-visible:ring-[#B83B5E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-700 font-semibold">Costo de esta línea</Label>
                  <p className="h-10 flex items-center font-semibold text-zinc-900">{money(lineCost(line), 4)}</p>
                </div>
              </div>
            </div>
          )
        })}

        <Button type="button" variant="outline" onClick={addLine} className="w-full border-dashed border-2 hover:bg-zinc-50 hover:text-[#B83B5E] hover:border-rose-200 transition-colors">
          + Agregar otro ingrediente
        </Button>
      </div>

      {/* Tarjeta de Totales y Márgenes en Vivo */}
      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-6 space-y-2 text-zinc-700">
        <p className="text-base">
          Costo de la receta: <span className="font-serif font-bold text-xl text-zinc-900 ml-1">{money(totalCost)}</span>
        </p>
        <p className="text-base">
          Costo por porción: <span className="font-serif font-bold text-xl text-zinc-900 ml-1">{money(unitCost)}</span>
          {precio !== null && <span className="text-zinc-500 text-sm ml-2">· precio de venta {money(precio)}</span>}
        </p>
        {margin !== null && (
          <p className="text-base">
            Margen: <span className={`font-bold ml-1 ${margin > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{margin.toFixed(1)} %</span>
          </p>
        )}
        {sinCosto && (
          <Alert variant="warning" className="mt-2">
            Algún insumo todavía no tiene costo: registra una compra para que el costo sea real.
          </Alert>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Receta guardada exitosamente.</Alert>}

      <div className="flex justify-end border-t border-zinc-100 pt-6">
        <Button type="submit" disabled={isPending} className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">
          {isPending ? <><Spinner /> Guardando...</> : 'Guardar receta'}
        </Button>
      </div>
    </form>
  )
}