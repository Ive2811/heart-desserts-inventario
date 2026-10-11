'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function updateProduct(formData: FormData): Promise<{ error?: string; success?: true }> {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category_id') ?? '')
  const priceRaw = String(formData.get('sale_price') ?? '').trim()
  const min_stock = Number(formData.get('min_stock') || 0)

  if (!UUID.test(id)) return { error: 'Producto no válido' }
  if (!name) return { error: 'Escribe el nombre del producto' }
  if (name.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 caracteres)' }
  if (category && !UUID.test(category)) return { error: 'Categoría no válida' }
  const price = priceRaw === '' ? null : Number(priceRaw)
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000)) return { error: 'El precio no es válido' }
  if (!Number.isInteger(min_stock) || min_stock < 0) return { error: 'El stock mínimo debe ser un entero igual o mayor que cero' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update({
      name,
      category_id: category || null,
      sale_price: price === null ? null : Math.round(price * 100) / 100,
      min_stock,
      active: formData.get('active') === 'on',
    })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('updateProduct:', error)
    if (error.code === '23505') return { error: 'Ya existe un producto con ese nombre' }
    return { error: 'No se pudo guardar el producto' }
  }
  if (!data || data.length === 0) return { error: 'Solo la administradora puede editar productos' }

  revalidatePath('/productos')
  revalidatePath(`/productos/${id}`)
  return { success: true }
}
