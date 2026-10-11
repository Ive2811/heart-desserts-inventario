import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportHeader } from '@/components/report-header'
import { StatusBadge, type Status } from '@/components/status-badge'
import { DownloadButton } from '@/components/download-button'
import { getSettings } from '@/lib/settings'
import { formatMoney } from '@/lib/business'
import { CajaForm } from './caja-form'

const verFecha = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function estadoDiferencia(dif: number, money: (v: number) => string): Status {
  if (dif === 0) return { tone: 'ok', label: 'Caja cuadrada' }
  if (dif < 0) return { tone: 'critical', label: `Faltante ${money(Math.abs(dif))}` }
  return { tone: 'warning', label: `Sobrante ${money(dif)}` }
}

export default async function CajaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const params = await searchParams
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' })
  const pedida = params.fecha ?? ''
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(pedida) && pedida <= hoy ? pedida : hoy

  const supabase = await createClient()
  const { currency_symbol } = await getSettings()
  const money = (v: number) => formatMoney(v, currency_symbol)

  const [{ data: resumen, error }, { data: cierre }, { data: historial }] = await Promise.all([
    supabase.rpc('cash_day_summary', { p_date: fecha }),
    supabase.from('cash_closings').select('*').eq('business_date', fecha).maybeSingle(),
    supabase
      .from('cash_closings')
      .select('business_date, expected_cash, cash_counted, difference')
      .order('business_date', { ascending: false })
      .limit(10),
  ])

  const r = resumen?.[0]
  const efectivo = Number(r?.cash_sales ?? 0)
  const tarjeta = Number(r?.card_sales ?? 0)
  const transferencia = Number(r?.transfer_sales ?? 0)
  const totalVendido = efectivo + tarjeta + transferencia

  const tarjetaDato = 'bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm'

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full print:bg-white">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <ReportHeader title="Corte de caja (Corte Z)" subtitle={`Día ${verFecha(fecha)}`} />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Corte de caja</h1>
            <p className="text-sm text-zinc-500 mt-1">Cuadra el efectivo y los pagos digitales del día.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
            </Link>
            {cierre && <DownloadButton />}
          </div>
        </div>

        <form method="get" className="flex items-end gap-3 print:hidden">
          <div className="space-y-1.5">
            <label htmlFor="fecha" className="text-sm font-semibold text-zinc-700">Día</label>
            <input id="fecha" name="fecha" type="date" max={hoy} defaultValue={fecha} className="flex h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]" />
          </div>
          <Button type="submit" variant="outline" className="bg-white">Ver día</Button>
        </form>

        {error && <Alert variant="error">No se pudo calcular el resumen. Verifica que la migración 0005 esté aplicada en Supabase.</Alert>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={tarjetaDato}><p className="text-xs text-zinc-500">Ventas completadas</p><p className="text-2xl font-serif font-bold text-zinc-900">{r?.sales_count ?? 0}</p></div>
          <div className={tarjetaDato}><p className="text-xs text-zinc-500">Efectivo</p><p className="text-2xl font-serif font-bold text-zinc-900">{money(efectivo)}</p></div>
          <div className={tarjetaDato}><p className="text-xs text-zinc-500">Tarjeta</p><p className="text-2xl font-serif font-bold text-zinc-900">{money(tarjeta)}</p></div>
          <div className={tarjetaDato}><p className="text-xs text-zinc-500">Transferencia</p><p className="text-2xl font-serif font-bold text-zinc-900">{money(transferencia)}</p></div>
        </div>
        <p className="text-sm text-zinc-600">Total vendido del día: <span className="font-bold text-zinc-900">{money(totalVendido)}</span>
          {(r?.cancelled_count ?? 0) > 0 && <span className="text-zinc-400"> · {r?.cancelled_count} anulada(s) no cuentan</span>}
        </p>

        {cierre ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-zinc-900">Caja cerrada</h2>
              <StatusBadge status={estadoDiferencia(Number(cierre.difference), money)} />
            </div>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between text-zinc-600"><span>Fondo inicial</span><span>{money(Number(cierre.opening_float))}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Ventas en efectivo (al cerrar)</span><span>{money(Number(cierre.cash_sales))}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Esperado en caja</span><span>{money(Number(cierre.expected_cash))}</span></div>
              <div className="flex justify-between font-bold text-zinc-900"><span>Efectivo contado</span><span>{money(Number(cierre.cash_counted))}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Pagos digitales (tarjeta + transferencia)</span><span>{money(Number(cierre.card_sales) + Number(cierre.transfer_sales))}</span></div>
            </div>
            {cierre.note && <p className="text-xs text-zinc-500">Nota: {cierre.note}</p>}
            <p className="text-xs text-zinc-400">Cerrada el {new Date(cierre.closed_at).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/El_Salvador' })}</p>
          </div>
        ) : (
          <CajaForm fecha={fecha} ventasEfectivo={efectivo} />
        )}

        {historial && historial.length > 0 && (
          <div className="space-y-3 print:hidden">
            <h2 className="font-semibold text-zinc-900">Últimos cortes</h2>
            <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-zinc-700">Día</TableHead>
                    <TableHead className="font-semibold text-zinc-700">Esperado</TableHead>
                    <TableHead className="font-semibold text-zinc-700">Contado</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-700">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((h) => (
                    <TableRow key={h.business_date} className="hover:bg-zinc-50/50">
                      <TableCell><Link href={`/caja?fecha=${h.business_date}`} className="text-[#B83B5E] font-semibold hover:underline">{verFecha(h.business_date)}</Link></TableCell>
                      <TableCell className="text-sm text-zinc-600">{money(Number(h.expected_cash))}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{money(Number(h.cash_counted))}</TableCell>
                      <TableCell className="text-right"><StatusBadge status={estadoDiferencia(Number(h.difference), money)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
