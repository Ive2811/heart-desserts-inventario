'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REASONS = ['expired', 'prep_error', 'dropped', 'spoiled', 'other'] as const

export async function registerWaste(input: {
  ingredient_id: string
  quantity: number
  reason_code: string
  note: string
}): Promise<{ error?: string; success?: true }> {
  if (!input || !UUID.test(String(input.ingredient_id))) return { error: 'Elige el insumo que se perdió' }

  const reason_code = REASONS.find((r) => r === input.reason_code)
  if (!reason_code) return { error: 'Elige qué pasó' }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 1_000_000_000) {
    return { error: 'La cantidad perdida debe ser mayor que cero' }
  }
  const note = String(input.note ?? '').trim()
  if (note.length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('adjust_ingredient', {
    p_ingredient_id: input.ingredient_id,
    p_delta: -Math.round(input.quantity * 1000) / 1000,
    p_type: 'waste',
    p_reason_code: reason_code,
    p_note: note,
  })

  if (error) {
    console.error('registerWaste:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para registrar pérdidas' }
    // P0001 = mensajes propios de la función (stock insuficiente, etc.)
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo registrar la pérdida. Intenta de nuevo.' }
  }

  revalidatePath('/insumos')
  revalidatePath('/reportes/kardex')
  revalidatePath('/')
  return { success: true }
}
