'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function updateIngredient(formData: FormData): Promise<{ error?: string; success?: true }> {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const min_stock = Number(formData.get('min_stock') || 0)
  const purchase_unit = String(formData.get('purchase_unit') ?? '').trim()
  const conversion_factor = Number(formData.get('conversion_factor') || 1)

  if (!UUID.test(id)) return { error: 'Insumo no válido' }
  if (!name) return { error: 'Escribe el nombre del insumo' }
  if (name.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 caracteres)' }
  if (!Number.isFinite(min_stock) || min_stock < 0) return { error: 'El stock mínimo no puede ser negativo' }
  if (purchase_unit.length === 0 || purchase_unit.length > 30) return { error: 'La unidad de compra debe tener entre 1 y 30 caracteres' }
  if (!Number.isFinite(conversion_factor) || conversion_factor <= 0) return { error: 'La equivalencia debe ser mayor que cero' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .update({
      name,
      min_stock: Math.round(min_stock * 1000) / 1000,
      purchase_unit,
      conversion_factor,
      is_perishable: formData.get('is_perishable') === 'on',
      active: formData.get('active') === 'on',
    })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('updateIngredient:', error)
    if (error.code === '23505') return { error: 'Ya existe un insumo con ese nombre' }
    return { error: 'No se pudo guardar el insumo' }
  }
  // Con RLS, un empleado no recibe error: simplemente no se actualiza ninguna fila
  if (!data || data.length === 0) return { error: 'Solo la administradora puede editar insumos' }

  revalidatePath('/insumos')
  return { success: true }
}
