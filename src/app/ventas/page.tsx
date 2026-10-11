import Link from 'next/link'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth-utils'
import { getSettings } from '@/lib/settings'
import { formatMoney } from '@/lib/business'
import { PAYMENT_LABEL } from '@/lib/labels'
import { formatDateTimeSV } from '@/lib/reports/dates'
import { formatDMY, todaySV } from '@/lib/reports/params'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AnularVentaButton, ReabrirDiaButton } from './venta-acciones'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha: fechaParam } = await searchParams
  const hoy = todaySV()
  const fecha = fechaParam && DATE.test(fechaParam) && fechaParam <= hoy ? fechaParam : hoy

  const supabase = await createClient()
  const [role, settings] = await Promise.all([getCurrentUserRole(), getSettings()])
  const isOwner = role === 'owner'
  const money = (n: number) => formatMoney(n, settings.currency_symbol)

  // Hora de El Salvador: UTC-6 sin horario de verano
  const inicio = `${fecha}T00:00:00-06:00`
  const fin = new Date(Date.parse(`${fecha}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) + 'T00:00:00-06:00'

  const [{ data: ventas, error }, { data: canales }, { data: corte }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, sold_at, channel, customer_name, status, total, payment_method, cancel_reason, sale_items(quantity, products(name))')
      .gte('sold_at', inicio)
      .lt('sold_at', fin)
      .order('sold_at', { ascending: false }),
    supabase.from('sale_channels').select('code, label'),
    supabase.from('cash_closings').select('closed_at, difference').eq('business_date', fecha).maybeSingle(),
  ])

  const canalPorCodigo = new Map((canales ?? []).map((c) => [c.code, c.label]))
  const completadas = (ventas ?? []).filter((v) => v.status === 'completed')
  const totalDia = completadas.reduce((s, v) => s + Number(v.total), 0)
  const cerrado = !!corte

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Ventas del día</h1>
            <p className="text-sm text-zinc-500 mt-1">Consulta lo vendido, corrige errores de digitación y revisa el estado de la caja.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white">Volver al panel</Button>
            </Link>
            <Link href="/ventas/nueva">
              <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 border-none">Registrar venta</Button>
            </Link>
          </div>
        </div>

        <form method="get" className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" defaultValue={fecha} max={hoy} className="h-10" />
          </div>
          <Button type="submit" className="bg-[#3A2D2A] text-white hover:bg-zinc-800 border-none">Ver día</Button>
          {fecha !== hoy && (
            <Link href="/ventas">
              <Button type="button" variant="outline" className="bg-white">Ir a hoy</Button>
            </Link>
          )}
          <p className="ml-auto text-sm text-zinc-600">
            Total vendido el {formatDMY(fecha)}: <span className="font-serif font-bold text-zinc-900">{money(totalDia)}</span>
          </p>
        </form>

        {cerrado && (
          <div role="status" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-start gap-3 text-amber-900">
              <Lock className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold">La caja de este día está cerrada.</p>
                <p className="text-amber-800">
                  No se pueden registrar ni anular ventas de este día.
                  {isOwner ? ' Puedes reabrirlo si necesitas corregir algo.' : ' Pide a la administradora que lo reabra si hace falta.'}
                </p>
              </div>
            </div>
            {isOwner && <ReabrirDiaButton date={fecha} />}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
            No se pudieron cargar las ventas. Intenta recargar la página.
          </p>
        )}

        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Hora</TableHead>
                <TableHead className="font-semibold text-zinc-700">Qué se vendió</TableHead>
                <TableHead className="font-semibold text-zinc-700">Canal y pago</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Total</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas && ventas.length > 0 ? (
                ventas.map((v) => (
                  <TableRow key={v.id} className="hover:bg-zinc-50/50 align-top">
                    <TableCell className="text-sm text-zinc-900 whitespace-nowrap">{formatDateTimeSV(v.sold_at).slice(-8)}</TableCell>
                    <TableCell className="text-sm text-zinc-700 max-w-xs">
                      {v.sale_items.map((i) => `${i.quantity} × ${i.products?.name ?? 'Producto'}`).join(', ')}
                      <span className="block text-xs text-zinc-400">{v.customer_name || 'Cliente general'}</span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {canalPorCodigo.get(v.channel) ?? v.channel}
                      <span className="block text-xs text-zinc-400">{PAYMENT_LABEL[v.payment_method] ?? v.payment_method}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {v.status === 'completed' ? 'Completada' : 'Anulada'}
                      </span>
                      {v.status !== 'completed' && v.cancel_reason && (
                        <span className="block text-xs text-zinc-500 mt-1">{v.cancel_reason}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-serif font-bold text-zinc-900">{money(Number(v.total))}</TableCell>
                    <TableCell className="text-right">
                      {v.status === 'completed' && isOwner && !cerrado && <AnularVentaButton saleId={v.id} />}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-sm">
                    No hay ventas registradas en esta fecha.
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
