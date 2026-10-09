import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { NuevoProveedorModal } from './nuevo-proveedor-modal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ProveedoresPage() {
  const supabase = await createClient()

  const { data: proveedores, error } = await supabase
    .from('suppliers')
    .select('id, name, phone, notes, active')
    .order('name', { ascending: true })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-zinc-500 mt-2">A quién le compras tus insumos.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline">Volver al Panel</Button>
          </Link>
          <NuevoProveedorModal />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">No se pudieron cargar los proveedores. Intenta recargar la página.</p>
      )}

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores && proveedores.length > 0 ? (
              proveedores.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {!p.active && <span className="block text-xs font-normal text-zinc-500">Inactivo</span>}
                  </TableCell>
                  <TableCell>{p.phone ?? '—'}</TableCell>
                  <TableCell>{p.notes ?? '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                  Aún no hay proveedores registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
