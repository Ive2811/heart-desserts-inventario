import { getSettings } from '@/lib/settings'
import { StatusBadge, stockStatus } from '@/components/status-badge'
import { formatMoney } from '@/lib/business'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { NuevoProductoModal } from './nuevo-producto-modal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const FULFILLMENT_LABEL = {
  made_to_order: 'Por encargo',
  made_to_stock: 'Por tanda',
} as const

export default async function ProductosPage() {
  const supabase = await createClient()
  const { currency_symbol } = await getSettings()

  const [{ data: productos, error }, { data: costos }, { data: categorias }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sale_price, fulfillment, current_stock, min_stock, active, product_categories(name)')
      .order('name', { ascending: true }),
    supabase.from('v_product_costing').select('product_id, unit_cost, margin_pct'),
    supabase
      .from('product_categories')
      .select('id, name')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])

  const costoPorProducto = new Map<string, { unit_cost: number | null; margin_pct: number | null }>()
  for (const c of costos ?? []) {
    if (c.product_id) costoPorProducto.set(c.product_id, { unit_cost: c.unit_cost, margin_pct: c.margin_pct })
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Productos</h1>
            <p className="text-sm text-zinc-500 mt-1">Lo que vendes, con el costo real de su receta.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
            </Link>
            <NuevoProductoModal categorias={categorias ?? []} />
          </div>
        </div>

        {error && (
          <Alert variant="error">
            No se pudieron cargar los productos. Intenta recargar la página.
          </Alert>
        )}

        {/* Tabla de Productos */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Producto</TableHead>
                <TableHead className="font-semibold text-zinc-700">Elaboración</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="font-semibold text-zinc-700">Precio</TableHead>
                <TableHead className="font-semibold text-zinc-700">Costo receta</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos && productos.length > 0 ? (
                productos.map((p) => {
                  const costo = costoPorProducto.get(p.id)
                  return (
                    <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/productos/${p.id}`} className="text-[#B83B5E] hover:text-rose-800 font-semibold transition-colors">
                          {p.name}
                        </Link>
                        <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                          {p.product_categories?.name ?? 'Sin categoría'}
                          {!p.active && ' · Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">{FULFILLMENT_LABEL[p.fulfillment]}</TableCell>
                      <TableCell>
                        {p.fulfillment === 'made_to_stock' ? (
                          <div className="space-y-1">
                            <StatusBadge status={stockStatus(p.current_stock, p.min_stock)} />
                            <span className="block text-xs text-zinc-500">{p.current_stock} en vitrina</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-900">
                        {p.sale_price === null ? '—' : formatMoney(Number(p.sale_price), currency_symbol)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">
                        {costo?.unit_cost == null ? (
                          <span className="text-zinc-400 italic">Sin receta</span>
                        ) : (
                          formatMoney(Number(costo.unit_cost), currency_symbol)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900">
                        {costo?.margin_pct == null ? '—' : (
                          <span className={Number(costo.margin_pct) > 50 ? 'text-emerald-600' : 'text-amber-600'}>
                            {`${Number(costo.margin_pct).toFixed(1)} %`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-sm">
                    Aún no hay productos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  )
}