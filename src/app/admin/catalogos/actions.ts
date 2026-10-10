'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Result = { error?: string; success?: true }

async function ownerClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' as const }
  const { data: profile } = await supabase.from('profiles').select('role, active').eq('id', user.id).single()
  if (!profile?.active || profile.role !== 'owner') return { error: 'Acción restringida solo para administradores' as const }
  return { supabase }
}

function mapError(error: { code?: string; message: string }): string {
  console.error('catalogos:', error)
  if (error.code === '23505') return 'Ya existe un registro con ese nombre'
  if (error.code === '23503') return 'Está en uso: desactívalo en lugar de borrarlo'
  if (error.code === '42501') return 'Solo los administradores pueden modificar los catálogos'
  return 'No se pudo guardar. Intenta de nuevo.'
}

const cleanLabel = (value: string, max: number) => String(value ?? '').trim().slice(0, max)

const slug = (label: string) =>
  label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

const done = (): Result => {
  revalidatePath('/admin/catalogos')
  revalidatePath('/ventas/nueva')
  revalidatePath('/productos')
  return { success: true }
}

// ------------------------------------------------------------ categorías de productos
export async function createCategory(label: string): Promise<Result> {
  const name = cleanLabel(label, 80)
  if (!name) return { error: 'Escribe un nombre' }
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }

  const { data: last } = await ctx.supabase.from('product_categories').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const { error } = await ctx.supabase.from('product_categories').insert({ name, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
  return error ? { error: mapError(error) } : done()
}

export async function renameCategory(id: string, label: string): Promise<Result> {
  const name = cleanLabel(label, 80)
  if (!name) return { error: 'Escribe un nombre' }
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('product_categories').update({ name }).eq('id', id).select('id')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se encontró la categoría' }
}

export async function toggleCategory(id: string, active: boolean): Promise<Result> {
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('product_categories').update({ active }).eq('id', id).select('id')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se encontró la categoría' }
}

export async function deleteCategory(id: string): Promise<Result> {
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('product_categories').delete().eq('id', id).select('id')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se pudo borrar (revisa que la migración 0005 esté aplicada)' }
}

// ------------------------------------------------------------ canales de venta (el id es el código)
export async function createChannel(label: string): Promise<Result> {
  const clean = cleanLabel(label, 40)
  const code = slug(clean)
  if (!clean || !code) return { error: 'Escribe un nombre con letras o números' }
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }

  const { data: last } = await ctx.supabase.from('sale_channels').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const { error } = await ctx.supabase.from('sale_channels').insert({ code, label: clean, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
  return error ? { error: mapError(error) } : done()
}

export async function renameChannel(code: string, label: string): Promise<Result> {
  const clean = cleanLabel(label, 40)
  if (!clean) return { error: 'Escribe un nombre' }
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('sale_channels').update({ label: clean }).eq('code', code).select('code')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se encontró el canal' }
}

export async function toggleChannel(code: string, active: boolean): Promise<Result> {
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('sale_channels').update({ active }).eq('code', code).select('code')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se encontró el canal' }
}

export async function deleteChannel(code: string): Promise<Result> {
  const ctx = await ownerClient()
  if ('error' in ctx) return { error: ctx.error }
  const { data, error } = await ctx.supabase.from('sale_channels').delete().eq('code', code).select('code')
  if (error) return { error: mapError(error) }
  return data && data.length > 0 ? done() : { error: 'No se encontró el canal' }
}
