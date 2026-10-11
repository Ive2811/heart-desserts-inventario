'use client'

import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { updateUserPermissions } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MODULOS } from '@/lib/modules'
import type { Tables } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function EditarUsuarioModal({ user }: { user: Tables<'profiles'> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [role, setRole] = useState<string>(user.role || 'staff')
  const [permissions, setPermissions] = useState<string[]>(user.permissions || [])

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    setRole(newRole)
    if (newRole === 'owner') {
      setPermissions(MODULOS.map(m => m.id))
    }
  }

  const togglePermission = (id: string) => {
    if (role === 'owner') return
    setPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const result = await updateUserPermissions(new FormData(event.currentTarget))
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('¡Permisos y datos actualizados con éxito!')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="text-xs">
          Editar permisos
        </Button>
      } />
      
      <DialogContent className="max-w-2xl rounded-2xl bg-white border border-zinc-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">Editar permisos de usuario</DialogTitle>
          <DialogDescription className="text-zinc-500 mt-1">
            Modifica el nombre, rol y marca los módulos permitidos para {user.full_name || 'este usuario'}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>
          <input type="hidden" name="userId" value={user.id} />

          {/* Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div className="space-y-2">
              <Label className="text-zinc-700 font-semibold text-xs">Nombre completo</Label>
              <Input name="full_name" defaultValue={user.full_name || ''} className="h-9 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-700 font-semibold text-xs">Rol en el sistema</Label>
              <select name="role" value={role} onChange={handleRoleChange} className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm">
                <option value="staff">Empleado</option>
                <option value="owner">Administrador</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`pw-${user.id}`} className="text-zinc-700 font-semibold text-xs">Nueva contraseña (opcional)</Label>
              <Input
                id={`pw-${user.id}`}
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="Déjala vacía para no cambiarla"
                className="h-9 bg-white"
              />
              <p className="text-xs text-zinc-500">Mínimo 8 caracteres. La persona deberá usarla la próxima vez que inicie sesión.</p>
            </div>
          </div>

          {/* Cuadrícula de Permisos por Módulo */}
          <div className="space-y-3">
            <Label className="text-zinc-800 font-bold text-sm">Módulos permitidos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULOS.map((mod) => {
                const isChecked = permissions.includes(mod.id)
                return (
                  <label key={mod.id} className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 bg-white hover:border-[#B83B5E] cursor-pointer transition-all select-none">
                    <input 
                      type="checkbox" 
                      name="permissions" 
                      value={mod.id}
                      checked={isChecked}
                      onChange={() => togglePermission(mod.id)}
                      disabled={role === 'owner'}
                      className="accent-[#B83B5E] w-4 h-4 mt-0.5 rounded border-zinc-300 cursor-pointer disabled:opacity-70"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{mod.label}</p>
                      <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">{mod.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#B83B5E] text-white hover:bg-rose-800">
              {loading ? <><Spinner /> Guardando...</> : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}