import 'server-only' // si alguien importa este archivo desde un componente de cliente, el build falla: la llave nunca llega al navegador
import { createClient } from '@supabase/supabase-js'

// Cliente con privilegios de administrador (service role). Úsalo solo en acciones de servidor, después de verificar el rol.
export function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
