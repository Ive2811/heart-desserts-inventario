import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { RecetaEditor } from './receta-editor'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const supabase = await createClient()

  const { data: producto } = await supabase
    .from('products')
    .select('id, name, sale_price, fulfillment')
    .eq('id', id)
    .maybeSingle()

  if (!producto) notFound()

  const [{ data: insumos }, { data: receta }] = await Promise.all([
    supabase
      .from('ingredients')
      .select('id, name, base_unit, avg_cost')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('recipes')
      .select('yield_portions, notes, recipe_items(ingredient_id, quantity, waste_pct)')
      .eq('product_id', id)
      .maybeSingle(),
  ])

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{producto.name}</h1>
          <p className="text-zinc-500 mt-2">
            {producto.fulfillment === 'made_to_order' ? 'Por encargo' : 'Por tanda'} · Receta y costo
          </p>
        </div>
        <Link href="/productos">
          <Button variant="outline">Volver a Productos</Button>
        </Link>
      </div>

      {!insumos || insumos.length === 0 ? (
        <div className="border rounded-xl bg-white shadow-sm p-8 text-center space-y-3">
          <p className="text-zinc-500">Primero registra tus insumos para poder armar la receta.</p>
          <Link href="/insumos">
            <Button>Ir a Insumos</Button>
          </Link>
        </div>
      ) : (
        <RecetaEditor
          productoId={producto.id}
          precio={producto.sale_price === null ? null : Number(producto.sale_price)}
          insumos={insumos.map((i) => ({
            id: i.id,
            name: i.name,
            base_unit: i.base_unit,
            avg_cost: Number(i.avg_cost),
          }))}
          inicial={
            receta
              ? {
                  yield_portions: receta.yield_portions,
                  notes: receta.notes ?? '',
                  items: receta.recipe_items.map((it) => ({
                    ingredient_id: it.ingredient_id,
                    quantity: Number(it.quantity),
                    waste_pct: Number(it.waste_pct),
                  })),
                }
              : null
          }
        />
      )}
    </div>
  )
}
