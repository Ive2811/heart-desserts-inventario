'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { MODULOS_SISTEMA_IDS } from '@/lib/modules'

export async function updateSettings(input: {
  business_name: string
  tagline: string
  currency_symbol: string
  logo_url: string
  enabled_modules: string[]
}): Promise<{ error?: string; success?: true }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('role, active').eq('id', user.id).single()
  if (!profile?.active || profile.role !== 'owner') {
    return { error: 'Acción restringida solo para administradores' }
  }

  const business_name = String(input?.business_name ?? '').trim()
  const tagline = String(input?.tagline ?? '').trim()
  const currency_symbol = String(input?.currency_symbol ?? '').trim()
  const logo_url = String(input?.logo_url ?? '').trim()

  if (business_name.length < 1 || business_name.length > 80) return { error: 'El nombre del negocio debe tener entre 1 y 80 caracteres' }
  if (tagline.length > 160) return { error: 'El eslogan no puede pasar de 160 caracteres' }
  if (currency_symbol.length < 1 || currency_symbol.length > 5) return { error: 'El símbolo de moneda debe tener entre 1 y 5 caracteres' }
  // Una ruta de la carpeta public (/logo.png) o una URL segura; nada de "javascript:" ni rutas raras
  if (!/^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(logo_url) || logo_url.length > 500) {
    return { error: 'El logo debe ser una ruta como /logo.png o una URL que empiece con https://' }
  }

  const enabled_modules = Array.from(
    new Set((Array.isArray(input?.enabled_modules) ? input.enabled_modules : []).filter((m) => MODULOS_SISTEMA_IDS.includes(m)))
  )

  const { data, error } = await supabase
    .from('business_settings')
    .update({ business_name, tagline, currency_symbol, logo_url, enabled_modules })
    .eq('id', true)
    .select('id')

  if (error) {
    console.error('updateSettings:', error)
    return { error: 'No se pudo guardar la configuración. Intenta de nuevo.' }
  }
  if (!data || data.length === 0) {
    return { error: 'No se pudo guardar: verifica que la migración 0005 esté aplicada en Supabase.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
