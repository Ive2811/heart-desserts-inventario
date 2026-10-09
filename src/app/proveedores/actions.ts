'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSupplier(formData: FormData): Promise<{ error?: string; success?: true }> {
  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!name) return { error: 'Escribe el nombre del proveedor' }
  if (name.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 caracteres)' }
  if (phone.length > 30) return { error: 'El teléfono es demasiado largo' }
  if (notes.length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .insert([{ name, phone: phone || null, notes: notes || null }])

  if (error) {
    console.error('createSupplier:', error)
    if (error.code === '23505') return { error: 'Ya existe un proveedor con ese nombre' }
    if (error.code === '42501') return { error: 'Solo la dueña puede agregar proveedores' }
    return { error: 'No se pudo guardar el proveedor' }
  }

  revalidatePath('/proveedores')
  revalidatePath('/compras/nueva')
  return { success: true }
}
