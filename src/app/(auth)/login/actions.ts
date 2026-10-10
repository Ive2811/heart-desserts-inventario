'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  // Se escribe solo el usuario (ej. admin o ana); el dominio interno se agrega automáticamente
  const email = `${username.toLowerCase().trim().split('@')[0]}@heartdesserts.local`

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent('Usuario o contraseña incorrectos')}`)
  }

  // Un usuario desactivado no debe poder entrar al sistema
  const { data: profile } = await supabase
    .from('profiles')
    .select('active')
    .eq('id', data.user.id)
    .single()

  if (!profile?.active) {
    await supabase.auth.signOut()
    redirect(`/login?error=${encodeURIComponent('Tu cuenta está inactiva. Habla con el administrador.')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}