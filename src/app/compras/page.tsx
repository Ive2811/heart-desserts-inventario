import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(value: string) {
  // 'AAAA-MM-DD' -> 'DD/MM/AAAA' sin pasar por Date (evita desfases de zona horaria)
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

export default async function ComprasPage() {
  const supabase = await createClient()

  const { data: compras, error } = await supabase
    .from('purchases')
    .select('id, purchased_on, invoice_number, total, suppliers(name)')
    .order('purchased_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Compras</h1>
            <p className="text-sm text-zinc-500 mt-1">Cada compra suma stock y actualiza el costo de tus insumos.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al Panel</Button>
            </Link>
            <Link href="/compras/nueva">
              <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors border-none">Nueva compra</Button>
            </Link>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
            No se pudieron cargar las compras. Intenta recargar la página.
          </p>
        )}

        {/* Tabla de Compras */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Fecha</TableHead>
                <TableHead className="font-semibold text-zinc-700">Proveedor</TableHead>
                <TableHead className="font-semibold text-zinc-700">Factura</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras && compras.length > 0 ? (
                compras.map((compra) => (
                  <TableRow key={compra.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900">{formatDate(compra.purchased_on)}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{compra.suppliers?.name ?? 'Sin proveedor'}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{compra.invoice_number ?? '—'}</TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900">${Number(compra.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-zinc-500 text-sm">
                    Aún no hay compras registradas.
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