import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { ConteoForm } from './conteo-form'

export default async function InventarioFisicoPage() {
  const supabase = await createClient()
  const { data: insumos, error } = await supabase
    .from('ingredients')
    .select('id, name, base_unit, current_stock')
    .eq('active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-40 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Inventario físico</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Cuenta lo que realmente hay y el sistema ajusta las diferencias. Cada ajuste queda en el kardex.
            </p>
          </div>
          <Link href="/insumos">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver a insumos</Button>
          </Link>
        </div>

        {error && <Alert variant="error">No se pudieron cargar los insumos. Intenta recargar la página.</Alert>}

        {insumos && insumos.length > 0 ? (
          <ConteoForm
            insumos={insumos.map((i) => ({ id: i.id, name: i.name, base_unit: i.base_unit, stock: Number(i.current_stock) }))}
          />
        ) : (
          <p className="text-center py-10 text-zinc-500 text-sm bg-white border border-zinc-200 rounded-2xl">
            No hay insumos activos para contar.
          </p>
        )}
      </div>
    </div>
  )
}
