import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS, type BusinessSettings } from '@/lib/business'

// Una consulta por petición. Si la tabla aún no existe o falla, la app sigue con los valores por defecto.
export const getSettings = cache(async (): Promise<BusinessSettings> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('business_settings')
      .select('business_name, tagline, currency_symbol, logo_url, enabled_modules')
      .maybeSingle()

    if (error || !data) return DEFAULT_SETTINGS

    const modules = Array.isArray(data.enabled_modules)
      ? data.enabled_modules.filter((m): m is string => typeof m === 'string')
      : DEFAULT_SETTINGS.enabled_modules

    return {
      business_name: data.business_name,
      tagline: data.tagline,
      currency_symbol: data.currency_symbol,
      logo_url: data.logo_url,
      enabled_modules: modules,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
})
