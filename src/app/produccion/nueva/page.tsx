import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProduccionForm, type ProductoTanda } from './produccion-form'

export default async function ProducirTandaPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(
      'id, name, current_stock, recipes(yield_portions, recipe_items(quantity, waste_pct, ingredients(name, base_unit, current_stock)))',
    )
    .eq('fulfillment', 'made_to_stock')
    .eq('active', true)
    .order('name', { ascending: true })

  const productos: ProductoTanda[] = []
  for (const p of data ?? []) {
    const receta = p.recipes
    if (!receta || receta.recipe_items.length === 0) continue
    productos.push({
      id: p.id,
      name: p.name,
      current_stock: p.current_stock,
      yield_portions: receta.yield_portions,
      items: receta.recipe_items.flatMap((it) => {
        const ing = it.ingredients
        return ing
          ? [{ name: ing.name, base_unit: ing.base_unit, stock: Number(ing.current_stock), quantity: Number(it.quantity), waste_pct: Number(it.waste_pct) }]
          : []
      }),
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-40 md:pb-28 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al panel"
            className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Producir tanda</h1>
        </div>

        {productos.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <p className="text-zinc-500 text-sm">
              Aún no tienes productos &quot;por tanda&quot; con receta. Crea un producto con elaboración por tanda y define su receta.
            </p>
            <Link href="/productos" className="text-[#B83B5E] text-sm font-bold hover:underline">
              Ir a productos
            </Link>
          </div>
        ) : (
          <ProduccionForm productos={productos} />
        )}
      </div>
    </div>
  )
}
