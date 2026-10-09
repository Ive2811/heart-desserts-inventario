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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-zinc-500 mt-2">Cada compra suma stock y actualiza el costo de tus insumos.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline">Volver al Panel</Button>
          </Link>
          <Link href="/compras/nueva">
            <Button>Nueva compra</Button>
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">No se pudieron cargar las compras. Intenta recargar la página.</p>
      )}

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compras && compras.length > 0 ? (
              compras.map((compra) => (
                <TableRow key={compra.id}>
                  <TableCell className="font-medium">{formatDate(compra.purchased_on)}</TableCell>
                  <TableCell>{compra.suppliers?.name ?? 'Sin proveedor'}</TableCell>
                  <TableCell>{compra.invoice_number ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">${Number(compra.total).toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                  Aún no hay compras registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
