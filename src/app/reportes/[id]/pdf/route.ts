import { loadReport } from '@/lib/reports/context'
import { buildPdf } from '@/lib/reports/pdf'

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

    const bytes = await buildPdf(result.data, result.settings, result.userName)
    const sufijo = result.def.usesRange ? `_${result.range.desde}_${result.range.hasta}` : `_${new Date().toISOString().slice(0, 10)}`

    return new Response(bytes as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${id}${sufijo}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('pdf de reporte:', error)
    return new Response('No se pudo generar el PDF', { status: 500 })
  }
}
