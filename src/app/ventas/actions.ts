'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Result = { error?: string; success?: true }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

function refrescar() {
  revalidatePath('/ventas')
  revalidatePath('/insumos')
  revalidatePath('/productos')
  revalidatePath('/')
}

// Anula una venta y devuelve los insumos a sus lotes. La base de datos exige que sea la administradora
// y bloquea las ventas de un día con corte de caja cerrado.
export async function cancelSale(saleId: string, reason: string): Promise<Result> {
  if (!UUID.test(String(saleId))) return { error: 'Venta no válida' }
  const motivo = String(reason ?? '').trim()
  if (motivo.length < 3) return { error: 'Escribe el motivo de la anulación (mínimo 3 caracteres)' }
  if (motivo.length > 200) return { error: 'El motivo es demasiado largo (máximo 200 caracteres)' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_sale', { p_sale_id: saleId, p_reason: motivo })

  if (error) {
    console.error('cancelSale:', error)
    if (error.code === '42501') return { error: 'Solo la administradora puede anular ventas' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo anular la venta. Intenta de nuevo.' }
  }

  refrescar()
  return { success: true }
}

// Reabre un día con corte de caja cerrado (solo administradora). El corte anterior queda en el historial.
export async function reopenDay(date: string, reason: string): Promise<Result> {
  if (!DATE.test(String(date))) return { error: 'Fecha no válida' }
  const motivo = String(reason ?? '').trim()
  if (motivo.length < 3) return { error: 'Escribe el motivo de la reapertura (mínimo 3 caracteres)' }
  if (motivo.length > 200) return { error: 'El motivo es demasiado largo (máximo 200 caracteres)' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reopen_cash_day', { p_date: date, p_reason: motivo })

  if (error) {
    console.error('reopenDay:', error)
    if (error.code === '42501') return { error: 'Solo la administradora puede reabrir un día' }
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo reabrir el día. Intenta de nuevo.' }
  }

  refrescar()
  revalidatePath('/caja')
  return { success: true }
}
