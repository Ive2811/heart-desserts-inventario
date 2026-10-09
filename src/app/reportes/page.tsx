import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, PackageCheck } from 'lucide-react'

export default async function ReportesHubPage() {
  const supabase = await createClient()

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-0.5">Heart Desserts</p>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Centro de reportes</h1>
            <p className="text-sm text-zinc-500 mt-1">Selecciona el reporte detallado que deseas consultar e imprimir.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al Panel</Button>
          </Link>
        </div>

        {/* Tarjetas de Navegación de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link href="/reportes/ventas" className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-[#B83B5E] hover:shadow-md transition-all space-y-4 group">
            <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center text-[#B83B5E] group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-zinc-900">Reporte de ventas</h2>
              <p className="text-xs text-zinc-500 mt-1">Listado detallado de transacciones, canales y totales.</p>
            </div>
          </Link>

          <Link href="/reportes/ventas-por-dia" className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-[#B83B5E] hover:shadow-md transition-all space-y-4 group">
            <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center text-[#B83B5E] group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-zinc-900">Ventas por día</h2>
              <p className="text-xs text-zinc-500 mt-1">Resumen agrupado de ingresos diarios por mostrador y redes.</p>
            </div>
          </Link>

          <Link href="/reportes/kardex" className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-[#B83B5E] hover:shadow-md transition-all space-y-4 group">
            <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center text-[#B83B5E] group-hover:scale-105 transition-transform">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-zinc-900">Kardex de insumos</h2>
              <p className="text-xs text-zinc-500 mt-1">Historial de entradas, salidas, compras y mermas de materia prima.</p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}