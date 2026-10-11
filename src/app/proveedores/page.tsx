import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { NuevoProveedorModal } from './nuevo-proveedor-modal'
import { EditarProveedor } from './editar-proveedor'
import { checkIsOwner } from '@/lib/auth-utils'
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
  const isOwner = await checkIsOwner()

  const { data: proveedores, error } = await supabase
    .from('suppliers')
    .select('id, name, phone, notes, active')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Proveedores</h1>
            <p className="text-sm text-zinc-500 mt-1">A quién le compras tus insumos.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al Panel</Button>
            </Link>
            <NuevoProveedorModal />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
            No se pudieron cargar los proveedores. Intenta recargar la página.
          </p>
        )}

        {/* Tabla de Proveedores */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Nombre</TableHead>
                <TableHead className="font-semibold text-zinc-700">Teléfono</TableHead>
                <TableHead className="font-semibold text-zinc-700">Nota</TableHead>
                {isOwner && <TableHead className="text-right font-semibold text-zinc-700"><span className="sr-only">Acciones</span></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores && proveedores.length > 0 ? (
                proveedores.map((p) => (
                  <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900">
                      {p.name}
                      {!p.active && <span className="block text-xs font-normal text-zinc-500 mt-0.5">Inactivo</span>}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">{p.phone ?? '—'}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{p.notes ?? '—'}</TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        <EditarProveedor proveedor={{ id: p.id, name: p.name, phone: p.phone, notes: p.notes, active: p.active }} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-zinc-500 text-sm">
                    Aún no hay proveedores registrados.
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