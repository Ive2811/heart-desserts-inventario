import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MermaForm } from './merma-form'

export default async function RegistrarPerdidaPage() {
  const supabase = await createClient()

  const { data: insumos } = await supabase
    .from('ingredients')
    .select('id, name, base_unit, current_stock')
    .eq('active', true)
    .gt('current_stock', 0)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al panel"
            className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Registrar pérdida</h1>
        </div>

        {!insumos || insumos.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <p className="text-zinc-500 text-sm">No hay insumos con existencias para descartar.</p>
            <Link href="/compras/nueva" className="text-[#B83B5E] text-sm font-bold hover:underline">
              Registrar una compra
            </Link>
          </div>
        ) : (
          <MermaForm
            insumos={insumos.map((i) => ({
              id: i.id,
              name: i.name,
              base_unit: i.base_unit,
              current_stock: Number(i.current_stock),
            }))}
          />
        )}
      </div>
    </div>
  )
}
