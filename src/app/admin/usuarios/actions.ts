'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { MODULO_IDS } from '@/lib/modules'

const SIN_LLAVE = 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor'

export async function updateUserPermissions(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active || profile.role !== 'owner') {
    return { error: 'Acción restringida solo para administradores' }
  }

  const adminSupabase = getAdminSupabase()
  if (!adminSupabase) return { error: SIN_LLAVE }

  const userId = String(formData.get('userId') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'staff') as 'owner' | 'staff'
  
  // Recogemos todos los permisos marcados en los checkboxes
  const permissions = role === 'owner'
    ? MODULO_IDS // los checkboxes deshabilitados no se envían, así que el administrador siempre recibe todos
    : (formData.getAll('permissions') as string[]).filter((id) => MODULO_IDS.includes(id))

  if (!userId) return { error: 'ID de usuario inválido' }
  if (userId === user.id && role !== 'owner') {
    return { error: 'No puedes quitarte tu propio rol de administrador' }
  }

  // 1. Actualizamos datos en Auth (Correo/Username y Contraseña si se escribió una nueva)
  const authUpdates: { email?: string; password?: string; user_metadata?: { full_name: string } } = {
    user_metadata: { full_name }
  }

  if (username) {
    authUpdates.email = `${username.toLowerCase().trim()}@heartdesserts.local`
  }

  if (password) {
    if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' }
    authUpdates.password = password
  }

  const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, authUpdates)
  if (authError) return { error: authError.message }

  // 2. Actualizamos la tabla profiles (Rol, Nombre, Estado Activo y Permisos por Módulo)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      role,
      permissions,
    })
    .eq('id', userId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function toggleUserActive(userId: string, currentActive: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active || profile.role !== 'owner') {
    return { error: 'Acción restringida solo para administradores' }
  }

  if (userId === user.id) return { error: 'No puedes desactivar tu propia cuenta' }

  const { error } = await supabase
    .from('profiles')
    .update({ active: !currentActive })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function createNewUser(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active || profile.role !== 'owner') {
    return { error: 'Acción restringida solo para administradores' }
  }

  const adminSupabase = getAdminSupabase()
  if (!adminSupabase) return { error: SIN_LLAVE }

  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'staff') as 'owner' | 'staff'
  const permissions = role === 'owner'
    ? MODULO_IDS
    : (formData.getAll('permissions') as string[]).filter((id) => MODULO_IDS.includes(id))

  if (!username || !password) {
    return { error: 'El usuario y la contraseña son obligatorios' }
  }
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' }
  if (!/^[a-z0-9._-]+$/i.test(username)) {
    return { error: 'El usuario solo puede tener letras, números, punto, guion y guion bajo' }
  }

  const email = `${username.toLowerCase().trim()}@heartdesserts.local`

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })

  if (authError) {
    if (/already|registered|exists/i.test(authError.message)) return { error: 'Ese usuario ya existe' }
    return { error: authError.message }
  }

  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role, active: true, full_name, permissions })
      .eq('id', authData.user.id)

    if (profileError) {
      // Sin perfil activo el usuario no puede trabajar: se revierte la creación para no dejarlo a medias
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return { error: 'No se pudo configurar el perfil del usuario. Intenta de nuevo.' }
    }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}