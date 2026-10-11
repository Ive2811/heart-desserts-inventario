import ExcelJS from 'exceljs'
import type { BusinessSettings } from '@/lib/business'
import { formatDateTimeSV } from './dates'
import type { ReportData } from './types'

const BRAND = 'FFB83B5E'

function numberFormat(type: string | undefined, symbol: string): string | undefined {
  if (type === 'money') return `"${symbol}"#,##0.00;-"${symbol}"#,##0.00`
  if (type === 'money4') return `"${symbol}"#,##0.0000;-"${symbol}"#,##0.0000`
  if (type === 'number') return '#,##0.###'
  return undefined
}

export async function buildExcel(report: ReportData, settings: BusinessSettings): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = settings.business_name
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(report.title.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: { orientation: report.orientation ?? 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  const lastCol = Math.max(report.columns.length, 2)

  sheet.mergeCells(1, 1, 1, lastCol)
  sheet.getCell(1, 1).value = settings.business_name
  sheet.getCell(1, 1).font = { bold: true, size: 14 }

  sheet.mergeCells(2, 1, 2, lastCol)
  sheet.getCell(2, 1).value = report.title
  sheet.getCell(2, 1).font = { bold: true, size: 12 }

  sheet.mergeCells(3, 1, 3, lastCol)
  sheet.getCell(3, 1).value = `${report.subtitle ? `${report.subtitle} · ` : ''}Generado el ${formatDateTimeSV(new Date().toISOString())}`
  sheet.getCell(3, 1).font = { size: 9, color: { argb: 'FF71717A' } }

  // Fila 5: encabezados
  const header = sheet.getRow(5)
  report.columns.forEach((column, i) => {
    const cell = header.getCell(i + 1)
    cell.value = column.header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    cell.alignment = { vertical: 'middle', horizontal: column.type && column.type !== 'text' ? 'right' : 'left' }
  })
  header.height = 20

  report.rows.forEach((row, r) => {
    const excelRow = sheet.getRow(6 + r)
    report.columns.forEach((column, i) => {
      const cell = excelRow.getCell(i + 1)
      const value = row[column.key]
      cell.value = value === undefined || value === '' ? null : value
      const format = numberFormat(column.type, settings.currency_symbol)
      if (format && typeof value === 'number') cell.numFmt = format
      cell.alignment = { vertical: 'top', wrapText: true, horizontal: column.type && column.type !== 'text' ? 'right' : 'left' }
    })
  })

  if (report.totals) {
    const totalsRow = sheet.getRow(6 + report.rows.length)
    report.columns.forEach((column, i) => {
      const cell = totalsRow.getCell(i + 1)
      const value = report.totals![column.key]
      cell.value = value === undefined ? null : value
      const format = numberFormat(column.type, settings.currency_symbol)
      if (format && typeof value === 'number') cell.numFmt = format
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE8EE' } }
      cell.border = { top: { style: 'thin' } }
    })
  }

  const totalWeight = report.columns.reduce((s, c) => s + (c.weight ?? 1), 0)
  report.columns.forEach((column, i) => {
    sheet.getColumn(i + 1).width = Math.max(11, Math.round(((column.weight ?? 1) / totalWeight) * report.columns.length * 16))
  })

  if (report.rows.length > 0) {
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + report.rows.length, column: report.columns.length } }
  }

  if (report.note) {
    const noteRow = 6 + report.rows.length + (report.totals ? 2 : 1)
    sheet.mergeCells(noteRow, 1, noteRow, lastCol)
    sheet.getCell(noteRow, 1).value = report.note
    sheet.getCell(noteRow, 1).font = { italic: true, size: 9, color: { argb: 'FF71717A' } }
    sheet.getCell(noteRow, 1).alignment = { wrapText: true, vertical: 'top' }
    sheet.getRow(noteRow).height = 30
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
