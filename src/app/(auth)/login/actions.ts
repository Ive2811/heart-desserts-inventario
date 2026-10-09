'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const email = `${username.toLowerCase().trim()}@heartdesserts.local`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Usuario+o+contraseña+incorrectos')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}