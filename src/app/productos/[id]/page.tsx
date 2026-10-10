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
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">{producto.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {producto.fulfillment === 'made_to_order' ? 'Por encargo' : 'Por tanda'} · Receta y costo
            </p>
          </div>
          <Link href="/productos">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver a productos</Button>
          </Link>
        </div>

        {!insumos || insumos.length === 0 ? (
          <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-8 text-center space-y-3">
            <p className="text-zinc-500 text-sm">Primero registra tus insumos para poder armar la receta.</p>
            <Link href="/insumos">
              <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">Ir a insumos</Button>
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
    </div>
  )
}