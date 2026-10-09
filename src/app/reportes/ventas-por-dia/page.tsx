import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DownloadButton } from '../download-button'

export default async function VentasPorDiaPage() {
  const supabase = await createClient()

  const { data: ventas } = await supabase
    .from('sales')
    .select('sold_at, total')
    .eq('status', 'completed')
    .order('sold_at', { ascending: false })

  // Agrupamos las ventas por fecha (YYYY-MM-DD)
  const ventasPorDiaMap = new Map<string, { total: count; cantidad: number }>()
  
  for (const v of ventas || []) {
    const fecha = v.sold_at.split('T')[0]
    const actual = ventasPorDiaMap.get(fecha) || { total: 0, cantidad: 0 }
    ventasPorDiaMap.set(fecha, {
      total: actual.total + Number(v.total || 0),
      cantidad: actual.cantidad + 1
    })
  }

  const resumenDiario = Array.from(ventasPorDiaMap.entries()).map(([fecha, datos]) => ({
    fecha,
    total: datos.total,
    cantidad: datos.cantidad
  }))

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full print:bg-white">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Ventas acumuladas por día</h1>
            <p className="text-sm text-zinc-500 mt-1">Corte diario de ingresos y número de tickets completados.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/reportes">
              <Button variant="outline" className="bg-white">Volver a reportes</Button>
            </Link>
            <DownloadButton />
          </div>
        </div>

        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Fecha</TableHead>
                <TableHead className="font-semibold text-zinc-700">Cantidad de ventas</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Ingreso total del día</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumenDiario.length > 0 ? (
                resumenDiario.map((item) => (
                  <TableRow key={item.fecha} className="hover:bg-zinc-50/50">
                    <TableCell className="font-medium text-zinc-900">{item.fecha}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{item.cantidad} ventas</TableCell>
                    <TableCell className="text-right font-serif font-bold text-emerald-700">${Number(item.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-zinc-500 text-sm">
                    No hay registros de ventas diarios.
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