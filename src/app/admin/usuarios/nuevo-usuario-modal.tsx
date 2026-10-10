'use client'

import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { createNewUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MODULOS } from '@/lib/modules'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const selectClass =
  'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]'

export function NuevoUsuarioModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('staff')
  const [permissions, setPermissions] = useState<string[]>([])

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    setRole(newRole)
    if (newRole === 'owner') {
      // Si es admin, seleccionamos todos los módulos automáticamente
      setPermissions(MODULOS.map(m => m.id))
    } else {
      setPermissions([])
    }
  }

  const togglePermission = (id: string) => {
    if (role === 'owner') return // Admin siempre los tiene todos
    setPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    
    const username = (form.elements.namedItem('username') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    if (!username || !password) {
      toast.error('Completa el usuario y la contraseña.')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const result = await createNewUser(new FormData(form))
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('¡Usuario creado con éxito!')
    form.reset()
    setRole('staff')
    setPermissions([])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors shadow-sm border-none">
          + Nuevo usuario
        </Button>
      } />
      
      <DialogContent className="max-w-2xl rounded-2xl bg-white border border-zinc-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">Crear nuevo usuario</DialogTitle>
          <DialogDescription className="text-zinc-500 mt-1">
            Registra el acceso rápido y define sus permisos por módulo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-zinc-700 font-semibold text-xs">Nombre completo</Label>
              <Input id="full_name" name="full_name" placeholder="ej. Ana Pérez" className="h-9 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-700 font-semibold text-xs">Usuario (login)</Label>
              <Input id="username" name="username" placeholder="ej. ana, mostrador1" required className="h-9 bg-white" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 font-semibold text-xs">Contraseña temporal</Label>
              <Input id="password" name="password" type="password" required className="h-9 bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-zinc-700 font-semibold text-xs">Rol en el sistema</Label>
              <select id="role" name="role" className={selectClass} value={role} onChange={handleRoleChange}>
                <option value="staff">Empleado</option>
                <option value="owner">Administrador</option>
              </select>
            </div>
          </div>

          {/* Módulos permitidos */}
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
              {loading ? <><Spinner /> Creando...</> : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}