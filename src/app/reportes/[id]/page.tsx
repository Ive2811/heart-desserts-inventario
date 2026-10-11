import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FileDown, FileSpreadsheet, Search } from 'lucide-react'
import { loadReport } from '@/lib/reports/context'
import { formatCell, isNumeric } from '@/lib/reports/format'
import { todaySV } from '@/lib/reports/params'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 25

type SearchParams = { desde?: string; hasta?: string; q?: string; page?: string }

export default async function ReportePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams

  const result = await loadReport(id, sp)
  if (result.status === 403) redirect('/?sinpermiso=1')
  if (result.status === 404) notFound()

  const { def, range, q, data, settings } = result
  const symbol = settings.currency_symbol

  const totalRows = data.rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1), totalPages)
  const visibles = data.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Los mismos filtros se usan para la pantalla, el PDF y el Excel
  const filtros = new URLSearchParams()
  if (def.usesRange) {
    filtros.set('desde', range.desde)
    filtros.set('hasta', range.hasta)
  }
  if (q) filtros.set('q', q)
  const query = filtros.toString() ? `?${filtros.toString()}` : ''

  function pageHref(n: number) {
    const p = new URLSearchParams(filtros)
    if (n > 1) p.set('page', String(n))
    const text = p.toString()
    return `/reportes/${id}${text ? `?${text}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-6xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">{def.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">{def.description}</p>
            {data.subtitle && <p className="text-xs text-zinc-400 mt-1">{data.subtitle}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/reportes">
              <Button variant="outline" className="bg-white">Volver a reportes</Button>
            </Link>
            <a href={`/reportes/${id}/pdf${query}`}>
              <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 border-none gap-2">
                <FileDown className="w-4 h-4" aria-hidden="true" /> Descargar PDF
              </Button>
            </a>
            <a href={`/reportes/${id}/excel${query}`}>
              <Button variant="outline" className="bg-white gap-2">
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> Descargar Excel
              </Button>
            </a>
          </div>
        </div>

        {/* Filtros: formulario GET, funciona sin JavaScript */}
        <form method="get" className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-4">
          {def.usesRange && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="desde">Desde</Label>
                <Input id="desde" name="desde" type="date" defaultValue={range.desde} max={todaySV()} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hasta">Hasta</Label>
                <Input id="hasta" name="hasta" type="date" defaultValue={range.hasta} max={todaySV()} className="h-10" />
              </div>
            </>
          )}
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label htmlFor="q">Buscar</Label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <Input id="q" name="q" defaultValue={q} maxLength={80} placeholder="Producto, cliente, insumo..." className="h-10 pl-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="bg-[#3A2D2A] text-white hover:bg-zinc-800 border-none">Aplicar</Button>
            <Link href={`/reportes/${id}`}>
              <Button type="button" variant="outline" className="bg-white">Limpiar</Button>
            </Link>
          </div>
        </form>

        {range.error && <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">{range.error}</p>}

        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                {data.columns.map((c) => (
                  <TableHead key={c.key} className={`font-semibold text-zinc-700 ${isNumeric(c) ? 'text-right' : ''}`}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.length > 0 ? (
                visibles.map((row, i) => (
                  <TableRow key={i} className="hover:bg-zinc-50/50">
                    {data.columns.map((c) => (
                      <TableCell key={c.key} className={`text-sm text-zinc-700 ${isNumeric(c) ? 'text-right tabular-nums' : ''}`}>
                        {formatCell(c, row[c.key], symbol)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="text-center py-10 text-zinc-500 text-sm">
                    No hay registros para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
              {data.totals && (
                <TableRow className="bg-rose-50/60 font-semibold">
                  {data.columns.map((c) => (
                    <TableCell key={c.key} className={`text-sm text-zinc-900 ${isNumeric(c) ? 'text-right tabular-nums' : ''}`}>
                      {formatCell(c, data.totals![c.key], symbol)}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-zinc-500">
          <p>
            {totalRows.toLocaleString('es-SV')} {totalRows === 1 ? 'registro' : 'registros'} · página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)}>
                <Button variant="outline" className="bg-white">Anterior</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled className="bg-white">Anterior</Button>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)}>
                <Button variant="outline" className="bg-white">Siguiente</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled className="bg-white">Siguiente</Button>
            )}
          </div>
        </div>

        {data.note && <p className="text-xs text-zinc-400 leading-relaxed">{data.note}</p>}
      </div>
    </div>
  )
}
