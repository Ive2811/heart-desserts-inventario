import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DownloadButton } from '../download-button'

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function ReporteVentasPage() {
  const supabase = await createClient()

  const { data: ventas } = await supabase
    .from('sales')
    .select('id, sold_at, channel, customer_name, total, status')
    .order('sold_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full print:bg-white">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Reporte de ventas detalladas</h1>
            <p className="text-sm text-zinc-500 mt-1">Historial de las últimas transacciones registradas.</p>
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
                <TableHead className="font-semibold text-zinc-700">Canal</TableHead>
                <TableHead className="font-semibold text-zinc-700">Cliente</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas && ventas.length > 0 ? (
                ventas.map((v) => (
                  <TableRow key={v.id} className="hover:bg-zinc-50/50">
                    <TableCell className="text-sm text-zinc-900">{formatDateTime(v.sold_at)}</TableCell>
                    <TableCell className="text-sm uppercase font-medium text-zinc-600">{v.channel}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{v.customer_name || 'Cliente general'}</TableCell>
                    <TableCell className="text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {v.status === 'completed' ? 'Completada' : 'Anulada'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-serif font-bold text-zinc-900">\${Number(v.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                    No hay ventas registradas.
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