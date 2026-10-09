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
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA INTERIOR */}
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Nueva compra</h1>
            <p className="text-sm text-zinc-500 mt-1">Registra lo que compraste; el stock se actualiza al guardar.</p>
          </div>
          <Link href="/compras">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Cancelar</Button>
          </Link>
        </div>

        {!insumos || insumos.length === 0 ? (
          <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm p-8 text-center space-y-3">
            <p className="text-zinc-500 text-sm">Primero registra tus insumos para poder comprarlos.</p>
            <Link href="/insumos">
              <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors">Ir a Insumos</Button>
            </Link>
          </div>
        ) : (
          <NuevaCompraForm insumos={insumos} proveedores={proveedores ?? []} today={today} />
        )}

      </div>
    </div>
  )
}