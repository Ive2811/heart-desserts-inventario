'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createProduction(input: {
  product_id: string
  portions: number
}): Promise<{ error?: string; success?: true }> {
  if (!input || !UUID.test(String(input.product_id))) return { error: 'Producto no válido' }
  if (!Number.isInteger(input.portions) || input.portions < 1 || input.portions > 100000) {
    return { error: 'Las porciones deben ser un número entero mayor que cero' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('register_production', {
    p_product_id: input.product_id,
    p_portions: input.portions,
  })

  if (error) {
    console.error('createProduction:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para registrar producción' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo registrar la producción. Intenta de nuevo.' }
  }

  revalidatePath('/')
  revalidatePath('/insumos')
  revalidatePath('/productos')
  revalidatePath('/ventas/nueva')
  revalidatePath('/reportes/kardex')
  return { success: true }
}
