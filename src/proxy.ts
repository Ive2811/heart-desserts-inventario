import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { MODULO_IDS, MODULOS_SISTEMA_IDS, RUTAS_SOLO_ADMIN, RUTA_A_MODULO, coincideRuta } from '@/lib/modules'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!user && !path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user) {
    const soloAdmin = RUTAS_SOLO_ADMIN.some((prefijo) => coincideRuta(path, prefijo))
    const modulo = RUTA_A_MODULO.find(([prefijo]) => coincideRuta(path, prefijo))?.[1]

    if (soloAdmin || modulo) {
      const volverAlInicio = () => {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.search = ''
        const redirect = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
        return redirect
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, active, permissions')
        .eq('id', user.id)
        .single()

      // Cuenta desactivada: se cierra la sesión y se manda al login
      if (!profile?.active) {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.search = `?error=${encodeURIComponent('Tu cuenta está inactiva. Habla con el administrador.')}`
        const redirect = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
        return redirect
      }

      const esAdmin = profile.role === 'owner'

      // 1) Rutas exclusivas del administrador (/admin, /reportes)
      if (soloAdmin && !esAdmin) return volverAlInicio()

      if (modulo && !soloAdmin) {
        // 2) Permiso por módulo del empleado
        if (!esAdmin && MODULO_IDS.includes(modulo) && !(profile.permissions ?? []).includes(modulo)) {
          return volverAlInicio()
        }
      }

      // 3) Módulo desactivado en la configuración del negocio (afecta a todos)
      if (modulo && MODULOS_SISTEMA_IDS.includes(modulo)) {
        const { data: settings } = await supabase
          .from('business_settings')
          .select('enabled_modules')
          .maybeSingle()
        const activos = settings?.enabled_modules
        if (Array.isArray(activos) && !activos.includes(modulo)) return volverAlInicio()
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
