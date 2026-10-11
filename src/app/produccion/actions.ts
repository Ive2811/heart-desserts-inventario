'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function registerProduction(input: {
  product_id: string
  tandas: number
  note: string
}): Promise<{ error?: string; success?: true; portions?: number }> {
  if (!input || !UUID.test(String(input.product_id))) return { error: 'Elige el producto a elaborar' }
  if (!Number.isInteger(input.tandas) || input.tandas < 1 || input.tandas > 1000) {
    return { error: 'Las tandas deben ser un número entero entre 1 y 1000' }
  }
  if (String(input.note ?? '').length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const supabase = await createClient()

  // El rendimiento se lee de la receta guardada, no del navegador.
  const { data: receta } = await supabase
    .from('recipes')
    .select('yield_portions')
    .eq('product_id', input.product_id)
    .maybeSingle()

  if (!receta) return { error: 'El producto no tiene receta registrada' }

  const portions = input.tandas * receta.yield_portions

  const { error } = await supabase.rpc('register_production', {
    p_product_id: input.product_id,
    p_portions: portions,
    p_note: String(input.note ?? '').trim(),
  })

  if (error) {
    console.error('registerProduction:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para registrar producción' }
    // P0001 = mensajes propios de la función (stock insuficiente, producto por encargo, etc.)
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo registrar la producción. Intenta de nuevo.' }
  }

  revalidatePath('/produccion/nueva')
  revalidatePath('/insumos')
  revalidatePath('/productos')
  revalidatePath('/')
  return { success: true, portions }
}
