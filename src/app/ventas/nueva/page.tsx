import { createClient } from '@/lib/supabase/server'
import { VentaForm } from './venta-form'

export default async function RegistrarVentaPage() {
  const supabase = await createClient()

  const [{ data: productos }, { data: insumos }, { data: canales }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sale_price, fulfillment, current_stock')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('ingredients')
      .select('id, name, base_unit')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('sale_channels')
      .select('code, label')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <VentaForm
      productos={(productos ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        sale_price: p.sale_price === null ? null : Number(p.sale_price),
        fulfillment: p.fulfillment,
        current_stock: Number(p.current_stock),
      }))}
      insumos={insumos ?? []}
      canales={canales ?? []}
    />
  )
}
