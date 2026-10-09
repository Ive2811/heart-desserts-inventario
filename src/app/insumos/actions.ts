'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UNITS = ['g', 'ml', 'unit'] as const
type Unit = (typeof UNITS)[number]

export async function createIngredient(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const base_unit = String(formData.get('base_unit') ?? '') as Unit
  const min_stock = Number(formData.get('min_stock')) || 0
  const purchase_unit_raw = String(formData.get('purchase_unit') ?? '').trim()
  const conversion_raw = String(formData.get('conversion_factor') ?? '').trim()
  const conversion_factor = conversion_raw === '' ? 1 : Number(conversion_raw)

  if (!name) return { error: 'Escribe el nombre del insumo' }
  if (!UNITS.includes(base_unit)) return { error: 'Unidad no válida' }
  if (min_stock < 0) return { error: 'El stock mínimo no puede ser negativo' }
  if (purchase_unit_raw.length > 30) return { error: 'La unidad de compra es demasiado larga' }
  if (!Number.isFinite(conversion_factor) || conversion_factor <= 0) {
    return { error: 'La equivalencia debe ser un número mayor que cero' }
  }

  const defaultPurchaseUnit = base_unit === 'unit' ? 'unidad' : base_unit
  const purchase_unit = purchase_unit_raw || defaultPurchaseUnit

  const supabase = await createClient()

  const { error } = await supabase.from('ingredients').insert([
    {
      name,
      base_unit,
      min_stock,
      purchase_unit,
      conversion_factor: purchase_unit_raw ? conversion_factor : 1,
    },
  ])

  if (error) {
    console.error('createIngredient:', error)
    if (error.code === '23505') return { error: 'Ya existe un insumo con ese nombre' }
    return { error: 'No se pudo guardar el insumo' }
  }

  revalidatePath('/insumos')
  return { success: true }
}