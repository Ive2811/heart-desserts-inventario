'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function applyPhysicalCount(input: {
  items: { ingredient_id: string; counted: number }[]
  note: string
}): Promise<{ error?: string; success?: true; changed?: number }> {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) return { error: 'No hay diferencias que aplicar' }
  if (input.items.length > 500) return { error: 'Demasiados insumos a la vez (máximo 500)' }
  const note = String(input.note ?? '').trim()
  if (note.length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const vistos = new Set<string>()
  for (const item of input.items) {
    if (!UUID.test(String(item.ingredient_id))) return { error: 'Hay un insumo no válido en el conteo' }
    if (vistos.has(item.ingredient_id)) return { error: 'Hay un insumo repetido en el conteo' }
    vistos.add(item.ingredient_id)
    if (!Number.isFinite(item.counted) || item.counted < 0 || item.counted > 1_000_000_000) {
      return { error: 'Todos los conteos deben ser números iguales o mayores que cero' }
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('apply_physical_count', {
    p_items: input.items.map((i) => ({ ingredient_id: i.ingredient_id, counted: Math.round(i.counted * 1000) / 1000 })),
    p_note: note,
  })

  if (error) {
    console.error('applyPhysicalCount:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para ajustar el inventario' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo aplicar el conteo. No se cambió nada; intenta de nuevo.' }
  }

  revalidatePath('/insumos')
  revalidatePath('/inventario-fisico')
  revalidatePath('/')
  return { success: true, changed: data ?? 0 }
}
