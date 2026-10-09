'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_AMOUNT = 1_000_000_000

export async function createProduct(
  formData: FormData,
): Promise<{ error: string } | { success: true; id: string }> {
  const name = String(formData.get('name') ?? '').trim()
  const category_raw = String(formData.get('category_id') ?? '').trim()
  const price_raw = String(formData.get('sale_price') ?? '').trim()
  const fulfillment = String(formData.get('fulfillment') ?? '')
  const min_stock = Number(formData.get('min_stock') || 0)

  if (!name) return { error: 'Escribe el nombre del producto' }
  if (name.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 caracteres)' }
  if (category_raw && !UUID.test(category_raw)) return { error: 'Categoría no válida' }

  const sale_price = price_raw === '' ? null : Number(price_raw)
  if (sale_price !== null && (!Number.isFinite(sale_price) || sale_price < 0 || sale_price > MAX_AMOUNT)) {
    return { error: 'El precio no es válido' }
  }
  if (fulfillment !== 'made_to_order' && fulfillment !== 'made_to_stock') {
    return { error: 'Elige cómo se elabora el producto' }
  }
  if (!Number.isInteger(min_stock) || min_stock < 0) {
    return { error: 'El stock mínimo debe ser un número entero, cero o mayor' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name,
        category_id: category_raw || null,
        sale_price: sale_price === null ? null : Math.round(sale_price * 100) / 100,
        fulfillment,
        min_stock: fulfillment === 'made_to_stock' ? min_stock : 0,
      },
    ])
    .select('id')
    .single()

  if (error || !data) {
    console.error('createProduct:', error)
    if (error?.code === '23505') return { error: 'Ya existe un producto con ese nombre' }
    if (error?.code === '42501') return { error: 'Solo la dueña puede agregar productos' }
    return { error: 'No se pudo guardar el producto' }
  }

  revalidatePath('/productos')
  return { success: true, id: data.id }
}

export type RecipeInput = {
  product_id: string
  yield_portions: number
  notes: string
  items: { ingredient_id: string; quantity: number; waste_pct: number }[]
}

// Hasta regenerar los tipos de Supabase, save_recipe no aparece en database.ts.
// Cuando lo regeneres puedes llamar directamente supabase.rpc('save_recipe', ...).
type UntypedRpc = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message: string } | null }>
}

export async function saveRecipe(input: RecipeInput): Promise<{ error?: string; success?: true }> {
  if (!input || typeof input !== 'object') return { error: 'Datos de receta no válidos' }
  if (!UUID.test(String(input.product_id))) return { error: 'Producto no válido' }
  if (!Number.isInteger(input.yield_portions) || input.yield_portions < 1 || input.yield_portions > 100000) {
    return { error: 'La receta debe rendir un número entero de porciones (mínimo 1)' }
  }
  if (String(input.notes ?? '').length > 500) return { error: 'La nota es demasiado larga (máximo 500 caracteres)' }
  if (!Array.isArray(input.items) || input.items.length === 0) return { error: 'Agrega al menos un ingrediente' }
  if (input.items.length > 60) return { error: 'La receta no puede tener más de 60 ingredientes' }

  const seen = new Set<string>()
  for (const item of input.items) {
    if (!UUID.test(String(item.ingredient_id))) return { error: 'Hay una línea sin ingrediente seleccionado' }
    if (seen.has(item.ingredient_id)) return { error: 'Hay un ingrediente repetido en la receta' }
    seen.add(item.ingredient_id)
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > MAX_AMOUNT) {
      return { error: 'Todas las cantidades deben ser mayores que cero' }
    }
    if (!Number.isFinite(item.waste_pct) || item.waste_pct < 0 || item.waste_pct > 100) {
      return { error: 'El desperdicio debe estar entre 0 y 100' }
    }
  }

  const supabase = (await createClient()) as unknown as UntypedRpc
  const { error } = await supabase.rpc('save_recipe', {
    p_product_id: input.product_id,
    p_yield_portions: input.yield_portions,
    p_notes: String(input.notes ?? '').trim(),
    p_items: input.items.map((i) => ({
      ingredient_id: i.ingredient_id,
      quantity: i.quantity,
      waste_pct: i.waste_pct,
    })),
  })

  if (error) {
    console.error('saveRecipe:', error)
    if (error.code === '42501') return { error: 'Solo la dueña puede editar recetas' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo guardar la receta. Intenta de nuevo.' }
  }

  revalidatePath('/productos')
  revalidatePath(`/productos/${input.product_id}`)
  return { success: true }
}
