'use client'

import { Spinner } from '@/components/ui/spinner'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Plus, Minus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { createSale, type SaleExtraInput, type SaleItemInput } from './actions'
import { PAYMENT_LABEL, UNIT_LABEL } from '@/lib/labels'
import { useBusiness } from '@/components/business-provider'
import { formatMoney } from '@/lib/business'

type Producto = {
  id: string
  name: string
  sale_price: number | null
  fulfillment: 'made_to_order' | 'made_to_stock'
  current_stock: number
}
type Insumo = { id: string; name: string; base_unit: 'g' | 'ml' | 'unit' }
type Extra = { key: number; ingredient_id: string; quantity: string; extra_price: string }
type Item = { key: number; product_id: string; quantity: number; price: string; extras: Extra[] }

const METODOS_PAGO = ['cash', 'card', 'transfer'] as const

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'
const inputClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'

const nuevoItem = (key: number): Item => ({ key, product_id: '', quantity: 1, price: '', extras: [] })

export function VentaForm({
  productos,
  insumos,
  canales,
}: {
  productos: Producto[]
  insumos: Insumo[]
  canales: { code: string; label: string }[]
}) {
  const { currency_symbol } = useBusiness()
  const money = (value: number) => formatMoney(value, currency_symbol)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const nextKey = useRef(2)

  const [canal, setCanal] = useState(canales.find((c) => c.code === 'local')?.code ?? canales[0]?.code ?? 'local')
  const [metodoPago, setMetodoPago] = useState<(typeof METODOS_PAGO)[number]>('cash')
  const [cliente, setCliente] = useState('')
  const [items, setItems] = useState<Item[]>([nuevoItem(1)])

  const productoPorId = new Map(productos.map((p) => [p.id, p]))
  const insumoPorId = new Map(insumos.map((i) => [i.id, i]))

  const updateItem = (key: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  const agregarProducto = () => setItems((prev) => [...prev, nuevoItem(nextKey.current++)])

  const eliminarItem = (key: number) => {
    if (items.length === 1) {
      toast.error('La venta debe tener al menos un producto')
      return
    }
    setItems((prev) => prev.filter((it) => it.key !== key))
  }

  const cambiarCantidad = (key: number, delta: number) => {
    const item = items.find((it) => it.key === key)
    if (!item) return
    if (item.quantity + delta < 1) {
      toast.error('La cantidad mínima es 1')
      return
    }
    updateItem(key, { quantity: item.quantity + delta })
  }

  const agregarExtra = (key: number) => {
    const item = items.find((it) => it.key === key)
    if (!item) return
    updateItem(key, {
      extras: [...item.extras, { key: nextKey.current++, ingredient_id: '', quantity: '', extra_price: '' }],
    })
  }

  const updateExtra = (itemKey: number, extraKey: number, patch: Partial<Extra>) => {
    const item = items.find((it) => it.key === itemKey)
    if (!item) return
    updateItem(itemKey, { extras: item.extras.map((e) => (e.key === extraKey ? { ...e, ...patch } : e)) })
  }

  const quitarExtra = (itemKey: number, extraKey: number) => {
    const item = items.find((it) => it.key === itemKey)
    if (!item) return
    updateItem(itemKey, { extras: item.extras.filter((e) => e.key !== extraKey) })
  }

  // Precio unitario = precio del producto + extras (el extra se cobra por cada unidad vendida)
  const precioBase = (it: Item) => {
    const p = productoPorId.get(it.product_id)
    if (!p) return 0
    return p.sale_price ?? (Number(it.price) || 0)
  }
  const precioExtras = (it: Item) => it.extras.reduce((sum, e) => sum + (Number(e.extra_price) || 0), 0)
  const total = items.reduce((sum, it) => sum + (precioBase(it) + precioExtras(it)) * it.quantity, 0)

  function handleConfirmarVenta() {
    const lineas: SaleItemInput[] = []
    for (const [index, it] of items.entries()) {
      const n = index + 1
      const producto = productoPorId.get(it.product_id)
      if (!producto) {
        toast.error(`Elige el producto de la línea ${n}.`)
        return
      }
      let unit_price: number | null = null
      if (producto.sale_price === null) {
        const precio = Number(it.price)
        if (it.price === '' || !Number.isFinite(precio) || precio < 0) {
          toast.error(`"${producto.name}" no tiene precio registrado: escríbelo en la línea ${n}.`)
          return
        }
        unit_price = precio
      }
      const extras: SaleExtraInput[] = []
      for (const e of it.extras) {
        const cantidad = Number(e.quantity)
        const precio = e.extra_price === '' ? 0 : Number(e.extra_price)
        if (!e.ingredient_id) {
          toast.error(`Elige el insumo de un extra en la línea ${n}.`)
          return
        }
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          toast.error(`La cantidad de un extra en la línea ${n} debe ser mayor que cero.`)
          return
        }
        if (!Number.isFinite(precio) || precio < 0) {
          toast.error(`El precio de un extra en la línea ${n} no es válido.`)
          return
        }
        extras.push({ ingredient_id: e.ingredient_id, quantity: cantidad, extra_price: precio })
      }
      lineas.push({ product_id: it.product_id, quantity: it.quantity, unit_price, extras })
    }

    startTransition(async () => {
      const result = await createSale({ channel: canal, payment_method: metodoPago, customer_name: cliente, items: lineas })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Venta de ${money(result.total ?? total)} registrada (${PAYMENT_LABEL[metodoPago]})`)
      setItems([nuevoItem(nextKey.current++)])
      setCliente('')
      router.refresh() // actualiza el stock disponible de los productos
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-32 flex flex-col justify-between min-h-screen">
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </Link>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Registrar venta</h1>
          </div>

          {productos.length === 0 && (
            <Alert variant="info">
              Todavía no hay productos activos. Crea uno en{' '}
              <Link href="/productos" className="underline text-[#B83B5E]">Productos</Link> para poder vender.
            </Alert>
          )}

          {/* Canal y cliente */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Canal</label>
              <div className="flex flex-wrap gap-2">
                {canales.map((opcion) => (
                  <button
                    type="button"
                    key={opcion.code}
                    onClick={() => setCanal(opcion.code)}
                    className={`text-sm font-medium px-5 py-2.5 rounded-full transition-all ${
                      canal === opcion.code
                        ? 'bg-[#3A2D2A] text-white shadow-md'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="cliente" className="text-sm font-semibold text-zinc-700">Cliente (opcional)</label>
              <input
                id="cliente"
                maxLength={120}
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="ej. María López"
                className={inputClass}
              />
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Método de pago</label>
            <div className="flex flex-wrap gap-2">
              {METODOS_PAGO.map((metodo) => (
                <button
                  type="button"
                  key={metodo}
                  onClick={() => setMetodoPago(metodo)}
                  className={`text-sm font-medium px-5 py-2.5 rounded-full transition-all ${
                    metodoPago === metodo
                      ? 'bg-[#3A2D2A] text-white shadow-md'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {PAYMENT_LABEL[metodo]}
                </button>
              ))}
            </div>
          </div>

          {/* Productos de la venta */}
          <div className="space-y-4">
            {items.map((item) => {
              const producto = productoPorId.get(item.product_id)
              const sinStock =
                producto?.fulfillment === 'made_to_stock' && item.quantity > producto.current_stock
              return (
                <div key={item.key} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 space-y-4 relative">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarItem(item.key)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pr-8">
                    <div className="flex-1 space-y-2">
                      <select
                        aria-label="Producto"
                        className={selectClass}
                        value={item.product_id}
                        onChange={(e) => updateItem(item.key, { product_id: e.target.value, price: '' })}
                      >
                        <option value="">Selecciona un producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.sale_price !== null ? ` · ${money(p.sale_price)}` : ''}
                          </option>
                        ))}
                      </select>
                      {producto && (
                        <p className="text-xs text-zinc-500">
                          {producto.sale_price !== null ? `${money(producto.sale_price)} c/u` : 'Sin precio registrado'}
                          {producto.fulfillment === 'made_to_stock' && ` · disponibles: ${producto.current_stock}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 border border-zinc-200 rounded-full px-2 py-1 shadow-sm bg-zinc-50 self-start">
                      <button type="button" onClick={() => cambiarCantidad(item.key, -1)} className="p-1 hover:bg-zinc-200 rounded-full text-zinc-700 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => cambiarCantidad(item.key, 1)} className="p-1 hover:bg-zinc-200 rounded-full text-zinc-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {producto && producto.sale_price === null && (
                    <div className="space-y-2 max-w-xs">
                      <label htmlFor={`precio-${item.key}`} className="text-xs font-semibold text-zinc-700">Precio de venta ({currency_symbol})</label>
                      <input
                        id={`precio-${item.key}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.key, { price: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {sinStock && producto && (
                    <Alert variant="warning">
                      Solo hay {producto.current_stock} disponibles de este producto. Registra una tanda antes de venderlo.
                    </Alert>
                  )}

                  <hr className="border-zinc-100" />

                  {/* Extras */}
                  <div className="space-y-3 text-sm">
                    <p className="text-xs font-bold text-zinc-400">Extras (por unidad)</p>

                    {item.extras.map((extra) => {
                      const insumo = insumoPorId.get(extra.ingredient_id)
                      return (
                        <div key={extra.key} className="grid gap-2 md:grid-cols-[1fr_8rem_8rem_auto] items-end">
                          <select
                            aria-label="Insumo del extra"
                            className={selectClass}
                            value={extra.ingredient_id}
                            onChange={(e) => updateExtra(item.key, extra.key, { ingredient_id: e.target.value })}
                          >
                            <option value="">Insumo del extra</option>
                            {insumos.map((i) => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>
                          <input
                            aria-label="Cantidad del extra"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            placeholder={insumo ? `Cant. (${UNIT_LABEL[insumo.base_unit]})` : 'Cantidad'}
                            value={extra.quantity}
                            onChange={(e) => updateExtra(item.key, extra.key, { quantity: e.target.value })}
                            className={inputClass}
                          />
                          <input
                            aria-label="Precio del extra"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder={`Precio (${currency_symbol})`}
                            value={extra.extra_price}
                            onChange={(e) => updateExtra(item.key, extra.key, { extra_price: e.target.value })}
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => quitarExtra(item.key, extra.key)}
                            className="h-10 px-2 text-zinc-400 hover:text-red-600 transition-colors"
                            title="Quitar extra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => agregarExtra(item.key)}
                      className="text-xs font-semibold text-[#B83B5E] hover:underline"
                    >
                      + Agregar extra
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={agregarProducto}
            className="w-full border-2 border-dashed border-rose-200 text-[#B83B5E] font-semibold py-4 rounded-2xl text-sm hover:bg-rose-50/50 active:scale-[0.98] transition-all shadow-sm"
          >
            + Agregar otro producto
          </button>

          <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
            Al confirmar, se descuentan del inventario los insumos de la receta y los extras elegidos.
          </p>
        </div>

        {/* Pie con total fijo en vivo */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-6 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-sm font-medium text-zinc-500">Total a pagar</span>
            <span className="text-4xl font-serif font-bold text-zinc-900">{money(total)}</span>
          </div>
          <button
            type="button"
            onClick={handleConfirmarVenta}
            disabled={isPending || productos.length === 0}
            className="w-full bg-[#B83B5E] text-white font-semibold py-4 rounded-2xl shadow-lg hover:bg-rose-800 active:scale-[0.98] transition-all text-base disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {isPending ? <><Spinner /> Guardando...</> : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
