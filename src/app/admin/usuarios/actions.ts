'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Cliente con privilegios de Administrador (Service Role) necesario para cambiar contraseñas y correos de otros usuarios
function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function updateUserPermissions(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = getAdminSupabase()

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

  const userId = String(formData.get('userId') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'staff') as 'owner' | 'staff'
  
  // Recogemos todos los permisos marcados en los checkboxes
  const permissions = formData.getAll('permissions') as string[]

  if (!userId) return { error: 'ID de usuario inválido' }

  // 1. Actualizamos datos en Auth (Correo/Username y Contraseña si se escribió una nueva)
  const authUpdates: { email?: string; password?: string; user_metadata?: { full_name: string } } = {
    user_metadata: { full_name }
  }

  if (username) {
    authUpdates.email = `${username.toLowerCase().trim()}@heartdesserts.local`
  }

  if (password && password.length >= 6) {
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
    } as any)
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
  const adminSupabase = getAdminSupabase()

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

  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'staff') as 'owner' | 'staff'
  const permissions = formData.getAll('permissions') as string[]

  if (!username || !password) {
    return { error: 'El usuario y la contraseña son obligatorios' }
  }

  const email = `${username.toLowerCase().trim()}@heartdesserts.local`

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })

  if (authError) return { error: authError.message }

  if (authData.user) {
    await supabase
      .from('profiles')
      .update({ role, active: true, full_name, permissions } as any) // <--- Y aquí también
      .eq('id', authData.user.id)
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}