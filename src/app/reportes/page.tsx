import Link from 'next/link'
import { BarChart3, Boxes, CalendarDays, FileText, PackageCheck, Trash2, Truck } from 'lucide-react'
import { requireOwner } from '@/lib/auth-utils'
import { REPORTS } from '@/lib/reports/definitions'
import { Button } from '@/components/ui/button'

const ICONOS: Record<string, typeof FileText> = {
  ventas: FileText,
  'ventas-por-dia': CalendarDays,
  kardex: PackageCheck,
  'inventario-valorizado': Boxes,
  'compras-por-proveedor': Truck,
  perdidas: Trash2,
}

export default async function ReportesHubPage() {
  await requireOwner()

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-xs tracking-wide text-zinc-400 font-bold mb-0.5">Heart Desserts</p>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Centro de reportes</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Cada reporte se puede filtrar por fechas y descargar como PDF formal o como hoja de Excel.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORTS.map((r) => {
            const Icono = ICONOS[r.id] ?? BarChart3
            return (
              <Link
                key={r.id}
                href={`/reportes/${r.id}`}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-[#B83B5E] hover:shadow-md transition-all space-y-4 group"
              >
                <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center text-[#B83B5E] group-hover:scale-105 transition-transform">
                  <Icono className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-zinc-900">{r.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">{r.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
