'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function updateSupplier(formData: FormData): Promise<{ error?: string; success?: true }> {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!UUID.test(id)) return { error: 'Proveedor no válido' }
  if (!name) return { error: 'Escribe el nombre del proveedor' }
  if (name.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 caracteres)' }
  if (phone.length > 30) return { error: 'El teléfono es demasiado largo' }
  if (notes.length > 300) return { error: 'La nota es demasiado larga (máximo 300 caracteres)' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update({ name, phone: phone || null, notes: notes || null, active: formData.get('active') === 'on' })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('updateSupplier:', error)
    if (error.code === '23505') return { error: 'Ya existe un proveedor con ese nombre' }
    return { error: 'No se pudo guardar el proveedor' }
  }
  if (!data || data.length === 0) return { error: 'Solo la administradora puede editar proveedores' }

  revalidatePath('/proveedores')
  revalidatePath('/compras/nueva')
  return { success: true }
}
