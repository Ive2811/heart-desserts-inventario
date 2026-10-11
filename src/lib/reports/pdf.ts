import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BusinessSettings } from '@/lib/business'
import { formatDateTimeSV } from './dates'
import { formatCell, isNumeric } from './format'
import type { ReportData } from './types'

const BRAND: [number, number, number] = [184, 59, 94] // #B83B5E
const INK: [number, number, number] = [39, 39, 42]
const MUTED: [number, number, number] = [113, 113, 122]

type Logo = { data: string; format: 'PNG' | 'JPEG' } | null

// Lee el logo desde /public (rutas locales) o desde una dirección https. Si falla, el PDF sale sin logo.
async function loadLogo(logoUrl: string): Promise<Logo> {
  try {
    let bytes: Buffer
    if (logoUrl.startsWith('https://')) {
      const response = await fetch(logoUrl, { signal: AbortSignal.timeout(3000) })
      if (!response.ok) return null
      bytes = Buffer.from(await response.arrayBuffer())
    } else if (logoUrl.startsWith('/') && !logoUrl.startsWith('//')) {
      const relative = path.normalize(logoUrl).replace(/^([/\\])+/, '')
      if (relative.startsWith('..')) return null
      bytes = await readFile(path.join(process.cwd(), 'public', relative))
    } else {
      return null
    }
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8
    if (!isPng && !isJpg) return null
    return { data: `data:image/${isPng ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`, format: isPng ? 'PNG' : 'JPEG' }
  } catch {
    return null
  }
}

export async function buildPdf(report: ReportData, settings: BusinessSettings, generatedBy: string): Promise<Uint8Array> {
  const orientation = report.orientation ?? 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const logo = await loadLogo(settings.logo_url)
  const generado = formatDateTimeSV(new Date().toISOString())

  doc.setProperties({
    title: `${report.title} · ${settings.business_name}`,
    author: settings.business_name,
    subject: report.subtitle ?? report.title,
  })

  function drawHeader() {
    let textX = margin
    if (logo) {
      doc.addImage(logo.data, logo.format, margin, 8, 16, 16)
      textX = margin + 20
    }
    doc.setTextColor(...INK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(settings.business_name, textX, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    if (settings.tagline) doc.text(settings.tagline, textX, 19)

    doc.setTextColor(...INK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(report.title, pageWidth - margin, 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    if (report.subtitle) doc.text(report.subtitle, pageWidth - margin, 17, { align: 'right' })
    doc.text(`Generado el ${generado}`, pageWidth - margin, 22, { align: 'right' })

    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.6)
    doc.line(margin, 27, pageWidth - margin, 27)
  }

  const available = pageWidth - margin * 2
  const totalWeight = report.columns.reduce((s, c) => s + (c.weight ?? 1), 0)
  const columnStyles = Object.fromEntries(
    report.columns.map((c, i) => [
      i,
      { cellWidth: (available * (c.weight ?? 1)) / totalWeight, halign: isNumeric(c) ? 'right' : 'left' } as const,
    ]),
  )

  const body = report.rows.map((row) => report.columns.map((c) => formatCell(c, row[c.key], settings.currency_symbol)))
  const hasTotals = !!report.totals
  if (report.totals) {
    body.push(report.columns.map((c) => formatCell(c, report.totals![c.key], settings.currency_symbol)))
  }

  autoTable(doc, {
    head: [report.columns.map((c) => c.header)],
    body,
    startY: 32,
    margin: { top: 32, left: margin, right: margin, bottom: 16 },
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: INK, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', halign: 'left' },
    alternateRowStyles: { fillColor: [250, 247, 245] },
    columnStyles,
    showHead: 'everyPage',
    didParseCell(data) {
      if (data.section === 'head') {
        data.cell.styles.halign = isNumeric(report.columns[data.column.index]) ? 'right' : 'left'
      }
      if (hasTotals && data.section === 'body' && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [253, 232, 238]
      }
    },
    didDrawPage() {
      drawHeader()
    },
  })

  if (report.rows.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('No hay registros para los filtros seleccionados.', margin, 44)
  }

  if (report.note) {
    const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40
    const lines = doc.splitTextToSize(report.note, available) as string[]
    let y = last + 6
    if (y + lines.length * 4 > pageHeight - 14) {
      doc.addPage()
      drawHeader()
      y = 36
    }
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(lines, margin, y)
  }

  // Pie de página con numeración (se escribe al final, cuando ya se conoce el total de páginas)
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${settings.business_name} · Preparado por ${generatedBy}`, margin, pageHeight - 6)
    doc.text(`Página ${i} de ${pages}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
  }

  return new Uint8Array(doc.output('arraybuffer'))
}
