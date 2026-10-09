import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DownloadButton } from '../download-button'

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function KardexPage() {
  const supabase = await createClient()

  const { data: movimientos } = await supabase
    .from('inventory_movements')
    .select('id, type, quantity, unit_cost, reason, note, created_at, ingredients(name, base_unit)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full print:bg-white">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Kardex de Materia Prima</h1>
            <p className="text-sm text-zinc-500 mt-1">Auditoría en tiempo real de entradas y salidas de insumos.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/reportes">
              <Button variant="outline" className="bg-white">Volver a Reportes</Button>
            </Link>
            <DownloadButton />
          </div>
        </div>

        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Fecha y Hora</TableHead>
                <TableHead className="font-semibold text-zinc-700">Insumo</TableHead>
                <TableHead className="font-semibold text-zinc-700">Tipo de Movimiento</TableHead>
                <TableHead className="font-semibold text-zinc-700">Cantidad</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Motivo / Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos && movimientos.length > 0 ? (
                movimientos.map((m: any) => (
                  <TableRow key={m.id} className="hover:bg-zinc-50/50">
                    <TableCell className="text-sm text-zinc-900">{formatDateTime(m.created_at)}</TableCell>
                    <TableCell className="font-medium text-zinc-900">{m.ingredients?.name}</TableCell>
                    <TableCell className="text-sm uppercase font-semibold text-zinc-600">{m.type}</TableCell>
                    <TableCell className={`text-sm font-bold ${Number(m.quantity) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(m.quantity) > 0 ? `+${m.quantity}` : m.quantity} {m.ingredients?.base_unit}
                    </TableCell>
                    <TableCell className="text-right text-sm text-zinc-500">{m.reason || m.note || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                    No hay movimientos registrados en el inventario.
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