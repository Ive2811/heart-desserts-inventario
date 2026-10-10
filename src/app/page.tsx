import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ShoppingBag, PackagePlus, Trash2, Clock, AlertTriangle, LogOut, Package, Layers, Users,
  TrendingUp, Landmark, Settings, Tags,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { BusinessLogo } from '@/components/business-logo'
import { StatusBadge, expiryStatus, stockStatus } from '@/components/status-badge'
import { getSettings } from '@/lib/settings'
import { UNIT_LABEL } from '@/lib/labels'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const settings = await getSettings()

  // Nombre real, rol y permisos del usuario desde la tabla profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, permissions')
    .eq('id', user.id)
    .single()

  const esAdmin = profile?.role === 'owner'
  const permisos = profile?.permissions ?? []
  // Un módulo se muestra si está activo en la configuración del negocio y el usuario tiene permiso
  const puede = (modulo: string) =>
    settings.enabled_modules.includes(modulo) && (esAdmin || permisos.includes(modulo))

  // Alertas reales: insumos en nivel crítico y lotes próximos a vencer
  const [{ data: bajos }, { data: porVencer }] = await Promise.all([
    supabase
      .from('v_ingredient_status')
      .select('id, name, base_unit, current_stock, min_stock')
      .eq('is_low', true)
      .gt('min_stock', 0)
      .order('name', { ascending: true }),
    supabase
      .from('v_expiring_lots')
      .select('lot_id, name, base_unit, qty_remaining, days_left')
      .order('days_left', { ascending: true }),
  ])
  const insumosPorAgotarse = bajos ?? []
  const lotesPorVencer = porVencer ?? []

  // Determinamos el saludo según la hora actual en El Salvador
  const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/El_Salvador', hour: 'numeric', hour12: false }))
  let saludo = 'Buenos días'
  if (hour >= 12 && hour < 18) {
    saludo = 'Buenas tardes'
  } else if (hour >= 18 || hour < 5) {
    saludo = 'Buenas noches'
  }

  const nombreUsuario = profile?.full_name ? profile.full_name.split(' ')[0] : user.email?.split('@')[0] || 'Equipo'

  const accionPrimaria = 'bg-[#B83B5E] text-white shadow-sm hover:bg-rose-800'
  const accionSecundaria = 'bg-[#FCE4EC] text-[#5C1D2F] shadow-sm hover:bg-[#F8BBD0]/80'
  const tarjetaAccion = 'p-5 rounded-3xl active:scale-[0.98] transition-all flex flex-col justify-between h-36'
  const tarjetaCatalogo = 'bg-white border border-zinc-200 p-4 rounded-2xl flex items-center gap-4 hover:border-rose-300 hover:shadow-sm transition-all group'
  const iconoCatalogo = 'bg-zinc-50 p-3 rounded-full text-zinc-500 group-hover:text-rose-600 transition-colors'

  const hayCatalogos = puede('insumos') || puede('productos') || puede('proveedores')

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-5xl mx-auto p-6 md:p-8 pb-28 space-y-8">

        {/* Encabezado con logotipo, saludo dinámico y cierre de sesión */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <BusinessLogo
              src={settings.logo_url}
              name={settings.business_name}
              className="w-14 h-14 rounded-full shadow-sm border border-rose-100 bg-white shrink-0"
            />
            <div>
              <p className="text-xs tracking-wide text-zinc-400 font-bold mb-0.5">
                {settings.business_name}
                {settings.tagline && <span className="font-normal"> · {settings.tagline}</span>}
              </p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900">
                {saludo}, {nombreUsuario} 👋
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Rol: <span className="font-medium text-zinc-700">{esAdmin ? 'Administrador' : 'Empleado'}</span>
              </p>
            </div>
          </div>

          <form action="/signout" method="post">
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-2.5 text-zinc-400 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Tarjeta: Por agotarse */}
        {insumosPorAgotarse.length > 0 ? (
          <div className="bg-[#FEF5E7] border border-[#FAD7A1]/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-[#8C5A2B] text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Por agotarse · {insumosPorAgotarse.length} {insumosPorAgotarse.length === 1 ? 'insumo' : 'insumos'}
            </h2>
            <div className="space-y-3 text-sm">
              {insumosPorAgotarse.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-3 font-medium text-[#6B4420]">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{item.name}</span>
                    <StatusBadge status={stockStatus(Number(item.current_stock), Number(item.min_stock))} />
                  </span>
                  <span className="font-bold whitespace-nowrap">
                    {Number(item.current_stock)} {item.base_unit ? UNIT_LABEL[item.base_unit] : ''}
                  </span>
                </div>
              ))}
            </div>
            {insumosPorAgotarse.length > 5 && (
              <Link href="/insumos" className="text-xs font-bold text-[#8C5A2B] hover:underline">
                Ver los {insumosPorAgotarse.length - 5} restantes
              </Link>
            )}
          </div>
        ) : (
          <Alert variant="success">Todos tus insumos están por encima del mínimo.</Alert>
        )}

        {/* Tarjeta: Vencen pronto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              <div className="bg-rose-50 p-2.5 rounded-full text-[#B83B5E]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 text-sm">Vencen pronto</h3>
            </div>
            <Link href="/insumos" className="text-[#B83B5E] text-xs font-bold hover:underline px-2">
              Ver todo
            </Link>
          </div>
          {lotesPorVencer.length > 0 ? (
            <div className="space-y-2 text-sm">
              {lotesPorVencer.slice(0, 4).map((lote) => (
                <div key={lote.lot_id} className="flex justify-between items-center gap-3">
                  <span className="text-zinc-700 truncate">
                    {lote.name}
                    <span className="text-zinc-400 text-xs">
                      {' '}· {Number(lote.qty_remaining)} {lote.base_unit ? UNIT_LABEL[lote.base_unit] : ''}
                    </span>
                  </span>
                  <StatusBadge status={lote.days_left === null ? null : expiryStatus(lote.days_left)} />
                </div>
              ))}
              {lotesPorVencer.length > 4 && (
                <p className="text-xs text-zinc-500">y {lotesPorVencer.length - 4} más</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 pl-1">Nada vence en los próximos 3 días.</p>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-zinc-800 text-base">¿Qué quieres hacer?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {puede('ventas') && (
              <Link href="/ventas/nueva" className={`${accionPrimaria} ${tarjetaAccion}`}>
                <FileText className="w-7 h-7 mb-4 opacity-90" />
                <span className="font-semibold text-sm leading-tight">Registrar<br />venta</span>
              </Link>
            )}
            {puede('compras') && (
              <Link href="/compras" className={`${accionSecundaria} ${tarjetaAccion}`}>
                <ShoppingBag className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
                <span className="font-semibold text-sm leading-tight">Registrar<br />compra</span>
              </Link>
            )}
            {puede('produccion') && (
              <Link href="/produccion/nueva" className={`${accionSecundaria} ${tarjetaAccion}`}>
                <PackagePlus className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
                <span className="font-semibold text-sm leading-tight">Producir<br />tanda</span>
              </Link>
            )}
            {puede('merma') && (
              <Link href="/merma/nueva" className={`${accionSecundaria} ${tarjetaAccion}`}>
                <Trash2 className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
                <span className="font-semibold text-sm leading-tight">Registrar<br />pérdida</span>
              </Link>
            )}
            {puede('caja') && (
              <Link href="/caja" className={`${accionSecundaria} ${tarjetaAccion}`}>
                <Landmark className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
                <span className="font-semibold text-sm leading-tight">Corte<br />de caja</span>
              </Link>
            )}
          </div>
        </div>

        {/* Accesos a catálogos y administración */}
        {(hayCatalogos || puede('reportes') || esAdmin) && (
          <div className="space-y-4 pt-8 border-t border-zinc-100">
            <h3 className="font-bold text-zinc-800 text-base">Catálogos y gestión</h3>

            {hayCatalogos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {puede('insumos') && (
                  <Link href="/insumos" className={tarjetaCatalogo}>
                    <div className={iconoCatalogo}><Package className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">Insumos</p>
                      <p className="text-xs text-zinc-500">Inventario y materias</p>
                    </div>
                  </Link>
                )}
                {puede('productos') && (
                  <Link href="/productos" className={tarjetaCatalogo}>
                    <div className={iconoCatalogo}><Layers className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">Productos</p>
                      <p className="text-xs text-zinc-500">Recetas y costos</p>
                    </div>
                  </Link>
                )}
                {puede('proveedores') && (
                  <Link href="/proveedores" className={tarjetaCatalogo}>
                    <div className={iconoCatalogo}><Users className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">Proveedores</p>
                      <p className="text-xs text-zinc-500">Contactos y compras</p>
                    </div>
                  </Link>
                )}
              </div>
            )}

            {puede('reportes') && (
              <Link href="/reportes" className={tarjetaCatalogo}>
                <div className={iconoCatalogo}><TrendingUp className="w-5 h-5" /></div>
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Reportes y analítica</p>
                  <p className="text-xs text-zinc-500">Márgenes y estado del negocio</p>
                </div>
              </Link>
            )}

            {esAdmin && (
              <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/admin/usuarios" className="bg-rose-50/60 border border-rose-200/60 p-4 rounded-2xl flex items-center gap-4 hover:bg-rose-100/50 transition-all group">
                  <div className="bg-white p-3 rounded-full text-[#B83B5E] shadow-sm"><Users className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-[#B83B5E] text-sm">Usuarios y permisos</p>
                    <p className="text-xs text-rose-700/70">Accesos y roles del personal</p>
                  </div>
                </Link>
                <Link href="/admin/configuracion" className="bg-rose-50/60 border border-rose-200/60 p-4 rounded-2xl flex items-center gap-4 hover:bg-rose-100/50 transition-all group">
                  <div className="bg-white p-3 rounded-full text-[#B83B5E] shadow-sm"><Settings className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-[#B83B5E] text-sm">Configuración del negocio</p>
                    <p className="text-xs text-rose-700/70">Nombre, logo, moneda y módulos</p>
                  </div>
                </Link>
                <Link href="/admin/catalogos" className="bg-rose-50/60 border border-rose-200/60 p-4 rounded-2xl flex items-center gap-4 hover:bg-rose-100/50 transition-all group">
                  <div className="bg-white p-3 rounded-full text-[#B83B5E] shadow-sm"><Tags className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-[#B83B5E] text-sm">Catálogos maestros</p>
                    <p className="text-xs text-rose-700/70">Categorías y canales de venta</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
