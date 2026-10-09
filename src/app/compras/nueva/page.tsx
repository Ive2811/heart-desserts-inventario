import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { NuevaCompraForm } from './nueva-compra-form'

export default async function NuevaCompraPage() {
  const supabase = await createClient()

  const [{ data: insumos }, { data: proveedores }] = await Promise.all([
    supabase
      .from('ingredients')
      .select('id, name, base_unit, purchase_unit, conversion_factor, is_perishable')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase.from('suppliers').select('id, name').eq('active', true).order('name', { ascending: true }),
  ])

  // Fecha de hoy en hora de El Salvador (formato AAAA-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva compra</h1>
          <p className="text-zinc-500 mt-2">Registra lo que compraste; el stock se actualiza al guardar.</p>
        </div>
        <Link href="/compras">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      {!insumos || insumos.length === 0 ? (
        <div className="border rounded-xl bg-white shadow-sm p-8 text-center space-y-3">
          <p className="text-zinc-500">Primero registra tus insumos para poder comprarlos.</p>
          <Link href="/insumos">
            <Button>Ir a Insumos</Button>
          </Link>
        </div>
      ) : (
        <NuevaCompraForm insumos={insumos} proveedores={proveedores ?? []} today={today} />
      )}
    </div>
  )
}
