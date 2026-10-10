'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SaleExtraInput = { ingredient_id: string; quantity: number; extra_price: number }
export type SaleItemInput = {
  product_id: string
  quantity: number
  unit_price: number | null // null = usa el precio registrado del producto
  extras: SaleExtraInput[]
}
export type SaleInput = { channel: string; payment_method: string; customer_name: string; items: SaleItemInput[] }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAYMENTS = ['cash', 'card', 'transfer'] as const
const MAX_AMOUNT = 1_000_000

export async function createSale(input: SaleInput): Promise<{ error?: string; success?: true; total?: number }> {
  if (!input || typeof input !== 'object') return { error: 'Datos de venta no válidos' }

  // El canal es un catálogo editable: la base de datos valida que exista y esté activo
  const channel = String(input.channel ?? '')
  if (!/^[a-z0-9_]{1,30}$/.test(channel)) return { error: 'Canal no válido' }
  const payment = PAYMENTS.find((m) => m === input.payment_method)
  if (!payment) return { error: 'Elige el método de pago' }
  const customer = String(input.customer_name ?? '').trim()
  if (customer.length > 120) return { error: 'El nombre del cliente es demasiado largo' }

  if (!Array.isArray(input.items) || input.items.length === 0) return { error: 'Agrega al menos un producto' }
  if (input.items.length > 50) return { error: 'Una venta no puede tener más de 50 productos' }

  for (const item of input.items) {
    if (!UUID.test(String(item.product_id))) return { error: 'Hay una línea sin producto seleccionado' }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) {
      return { error: 'Las cantidades deben ser números enteros mayores que cero' }
    }
    if (item.unit_price !== null && (!Number.isFinite(item.unit_price) || item.unit_price < 0 || item.unit_price > MAX_AMOUNT)) {
      return { error: 'El precio no es válido' }
    }
    if (!Array.isArray(item.extras) || item.extras.length > 10) return { error: 'Extras no válidos' }
    for (const e of item.extras) {
      if (!UUID.test(String(e.ingredient_id))) return { error: 'Hay un extra sin insumo seleccionado' }
      if (!Number.isFinite(e.quantity) || e.quantity <= 0 || e.quantity > MAX_AMOUNT) {
        return { error: 'La cantidad de cada extra debe ser mayor que cero' }
      }
      if (!Number.isFinite(e.extra_price) || e.extra_price < 0 || e.extra_price > MAX_AMOUNT) {
        return { error: 'El precio de cada extra no es válido' }
      }
    }
  }

  const supabase = await createClient()
  const { data: saleId, error } = await supabase.rpc('register_sale', {
    p_channel: channel,
    p_payment_method: payment,
    p_customer_name: customer,
    p_note: '',
    p_items: input.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      ...(i.unit_price === null ? {} : { unit_price: i.unit_price }),
      extras: i.extras.map((e) => ({
        ingredient_id: e.ingredient_id,
        quantity: e.quantity,
        extra_price: e.extra_price,
      })),
    })),
  })

  if (error) {
    console.error('createSale:', error)
    if (error.code === '42501') return { error: 'Tu cuenta no tiene permiso para registrar ventas' }
    // P0001 = mensajes propios de la función (ya están en español: stock insuficiente, sin receta, etc.)
    if (error.code === 'P0001') return { error: error.message }
    return { error: 'No se pudo registrar la venta. Intenta de nuevo.' }
  }

  const { data: sale } = await supabase.from('sales').select('total').eq('id', saleId).single()

  revalidatePath('/')
  revalidatePath('/insumos')
  revalidatePath('/productos')
  revalidatePath('/reportes/ventas')
  revalidatePath('/reportes/ventas-por-dia')
  revalidatePath('/reportes/kardex')
  return { success: true, total: sale ? Number(sale.total) : undefined }
}
