import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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

  const [{ data: productos, error }, { data: costos }, { data: categorias }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sale_price, fulfillment, active, product_categories(name)')
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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-zinc-500 mt-2">Lo que vendes, con el costo real de su receta.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline">Volver al Panel</Button>
          </Link>
          <NuevoProductoModal categorias={categorias ?? []} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">No se pudieron cargar los productos. Intenta recargar la página.</p>
      )}

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Elaboración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Costo receta</TableHead>
              <TableHead className="text-right">Margen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos && productos.length > 0 ? (
              productos.map((p) => {
                const costo = costoPorProducto.get(p.id)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/productos/${p.id}`} className="text-blue-600 hover:text-blue-800">
                        {p.name}
                      </Link>
                      <span className="block text-xs font-normal text-zinc-500">
                        {p.product_categories?.name ?? 'Sin categoría'}
                        {!p.active && ' · Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>{FULFILLMENT_LABEL[p.fulfillment]}</TableCell>
                    <TableCell>{p.sale_price === null ? '—' : `$${Number(p.sale_price).toFixed(2)}`}</TableCell>
                    <TableCell>
                      {costo?.unit_cost == null ? (
                        <span className="text-zinc-500">Sin receta</span>
                      ) : (
                        `$${Number(costo.unit_cost).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {costo?.margin_pct == null ? '—' : `${Number(costo.margin_pct).toFixed(1)} %`}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Aún no hay productos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
