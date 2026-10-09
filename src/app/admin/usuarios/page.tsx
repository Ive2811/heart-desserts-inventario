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
import { redirect } from 'next/navigation'
import { toggleUserActive } from './actions'
import { NuevoUsuarioModal } from './nuevo-usuario-modal'
import { EditarUsuarioModal } from './editar-usuario-modal'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!currentProfile?.active || currentProfile.role !== 'owner') {
    redirect('/')
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Administración de usuarios</h1>
            <p className="text-sm text-zinc-500 mt-1">Controla quiénes tienen acceso al sistema y qué permisos poseen.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al Panel</Button>
            </Link>
            <NuevoUsuarioModal />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
            No se pudieron cargar los usuarios.
          </p>
        )}

        {/* Tabla de Usuarios */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">ID de Usuario</TableHead>
                <TableHead className="font-semibold text-zinc-700">Nombre / Perfil</TableHead>
                <TableHead className="font-semibold text-zinc-700">Rol</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles && profiles.length > 0 ? (
                profiles.map((p) => (
                  <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-mono text-xs text-zinc-400">{p.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {p.full_name || 'Sin nombre registrado'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.role === 'owner' ? 'bg-rose-100 text-rose-800' : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {p.role === 'owner' ? 'Administrador' : 'Empleado (Staff)'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Botón para abrir el modal de edición de permisos y contraseña */}
                      <EditarUsuarioModal user={p} />

                      {/* Botón para activar/desactivar */}
                      <form action={async () => {
                        'use server'
                        await toggleUserActive(p.id, p.active)
                      }} className="inline">
                        <Button 
                          type="submit" 
                          variant="outline" 
                          size="sm" 
                          className={`text-xs ${p.active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          {p.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                    No hay usuarios registrados en el sistema.
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