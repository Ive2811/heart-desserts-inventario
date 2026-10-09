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