'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PurchaseItemInput = {
  ingredient_id: string
  quantity: number
  total_cost: number
  expires_on: string | null
}

export type PurchaseInput = {
  supplier_id: string | null
  purchased_on: string
  invoice: string
  note: string
  items: PurchaseItemInput[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_AMOUNT = 1_000_000_000

function isValidDate(value: string) {
  if (!DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}

export async function createPurchase(input: PurchaseInput): Promise<{ error?: string; success?: true }> {
  if (!input || typeof input !== 'object') return { error: 'Datos de compra no válidos' }

  if (input.supplier_id !== null && !UUID.test(input.supplier_id)) return { error: 'Proveedor no válido' }
  if (!isValidDate(input.purchased_on)) return { error: 'La fecha de la compra no es válida' }
  if (String(input.invoice ?? '').length > 60) return { error: 'El número de factura es demasiado largo' }
  if (String(input.note ?? '').length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  if (!Array.isArray(input.items) || input.items.length === 0) return { error: 'Agrega al menos un insumo a la compra' }
  if (input.items.length > 50) return { error: 'Una compra no puede tener más de 50 líneas' }

  for (const item of input.items) {
    if (!UUID.test(String(item.ingredient_id))) return { error: 'Hay una línea sin insumo seleccionado' }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > MAX_AMOUNT) {
      return { error: 'Todas las cantidades deben ser mayores que cero' }
    }
    if (!Number.isFinite(item.total_cost) || item.total_cost < 0 || item.total_cost > MAX_AMOUNT) {
      return { error: 'Todos los costos deben ser un número válido' }
    }
    if (item.expires_on !== null && !isValidDate(item.expires_on)) {
      return { error: 'Hay una fecha de vencimiento no válida' }
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('receive_purchase', {
    // la función acepta null (compra sin proveedor); los tipos generados lo marcan como string
    p_supplier_id: input.supplier_id as unknown as string,
    p_purchased_on: input.purchased_on,
    p_invoice: String(input.invoice ?? '').trim(),
    p_note: String(input.note ?? '').trim(),
    p_items: input.items.map((i) => ({
      ingredient_id: i.ingredient_id,
      quantity: i.quantity,
      total_cost: i.total_cost,
      expires_on: i.expires_on,
    })),
  })

  if (error) {
    console.error('createPurchase:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para registrar compras' }
    // P0001 = mensajes propios de la función (ya están en español)
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo registrar la compra. Intenta de nuevo.' }
  }

  revalidatePath('/compras')
  revalidatePath('/insumos')
  return { success: true }
}
