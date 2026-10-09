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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Insumos</h1>
          <p className="text-zinc-500 mt-2">Gestiona las existencias de tu materia prima.</p>
        </div>
<div className="flex gap-4">
  <Link href="/">
    <Button variant="outline">Volver al Panel</Button>
  </Link>
  <NuevoInsumoModal/>
</div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">No se pudieron cargar los insumos. Intenta recargar la página.</p>
      )}

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad Base</TableHead>
              <TableHead>Costo Promedio</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos && insumos.length > 0 ? (
              insumos.map((insumo) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">
                    {insumo.name}
                    {insumo.conversion_factor !== 1 && (
                      <span className="block text-xs font-normal text-zinc-500">
                        1 {insumo.purchase_unit} = {Number(insumo.conversion_factor)} {insumo.base_unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="uppercase">{insumo.base_unit}</TableCell>
                  <TableCell>${Number(insumo.avg_cost).toFixed(4)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {insumo.current_stock}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                  No hay insumos registrados en la base de datos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}