'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function closeCash(input: {
  date: string
  opening_float: number
  cash_counted: number
  note: string
}): Promise<{ error?: string; success?: true }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input?.date))) return { error: 'Fecha no válida' }
  for (const n of [input.opening_float, input.cash_counted]) {
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) return { error: 'El fondo inicial y el efectivo contado deben ser cero o más' }
  }
  const note = String(input.note ?? '').trim()
  if (note.length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const supabase = await createClient()
  // Los totales de ventas los calcula la base de datos; aquí solo se envía lo que cuenta la persona
  const { error } = await supabase.rpc('register_cash_closing', {
    p_date: input.date,
    p_opening_float: input.opening_float,
    p_cash_counted: input.cash_counted,
    p_note: note,
  })

  if (error) {
    console.error('closeCash:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para cerrar la caja' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo cerrar la caja. Intenta de nuevo.' }
  }

  revalidatePath('/caja')
  return { success: true }
}
