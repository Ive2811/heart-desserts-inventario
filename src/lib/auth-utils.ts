import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  return profile?.active ? profile.role : null
}

export async function checkIsOwner() {
  const role = await getCurrentUserRole()
  return role === 'owner'
}

// Segunda barrera dentro de las páginas (la primera es el proxy): si no es administrador, vuelve al inicio
export async function requireOwner() {
  if (!(await checkIsOwner())) redirect('/')
}
