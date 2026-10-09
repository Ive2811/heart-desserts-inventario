import { NuevoInsumoModal } from './nuevo-insumo-modal'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'

export default async function InsumosPage() {
  const supabase = await createClient()

  // Consultamos tu tabla real 'ingredients' ordenada por nombre alfabéticamente
  const { data: insumos, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Catálogo de Insumos</h1>
            <p className="text-sm text-zinc-500 mt-1">Gestiona las existencias de tu materia prima.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al Panel</Button>
            </Link>
            <NuevoInsumoModal/>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
            No se pudieron cargar los insumos. Intenta recargar la página.
          </p>
        )}

        {/* Tabla de Insumos */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Nombre</TableHead>
                <TableHead className="font-semibold text-zinc-700">Unidad Base</TableHead>
                <TableHead className="font-semibold text-zinc-700">Costo Promedio</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Stock Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos && insumos.length > 0 ? (
                insumos.map((insumo) => (
                  <TableRow key={insumo.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900">
                      {insumo.name}
                      {insumo.conversion_factor !== 1 && (
                        <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                          1 {insumo.purchase_unit} = {Number(insumo.conversion_factor)} {insumo.base_unit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="uppercase text-sm text-zinc-600">{insumo.base_unit}</TableCell>
                    <TableCell className="text-sm text-zinc-600">${Number(insumo.avg_cost).toFixed(4)}</TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900">
                      {insumo.current_stock}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-zinc-500 text-sm">
                    No hay insumos registrados en la base de datos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  )
}