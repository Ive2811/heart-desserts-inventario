import { loadReport } from '@/lib/reports/context'
import { buildExcel } from '@/lib/reports/excel'

export const runtime = 'nodejs'

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const url = new URL(request.url)

  try {
    const result = await loadReport(id, {
      desde: url.searchParams.get('desde') ?? undefined,
      hasta: url.searchParams.get('hasta') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
    })
    if (result.status === 403) return new Response('Acceso restringido a la administradora', { status: 403 })
    if (result.status === 404) return new Response('Reporte no encontrado', { status: 404 })

    const buffer = await buildExcel(result.data, result.settings)
    const sufijo = result.def.usesRange ? `_${result.range.desde}_${result.range.hasta}` : `_${new Date().toISOString().slice(0, 10)}`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${id}${sufijo}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('excel de reporte:', error)
    return new Response('No se pudo generar el archivo de Excel', { status: 500 })
  }
}
