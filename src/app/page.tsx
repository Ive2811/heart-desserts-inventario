import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, ShoppingBag, PackagePlus, Trash2, Clock, AlertTriangle, LogOut, Package, Layers, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const insumosPorAgotarse = [
    { id: 1, nombre: 'Queso crema', cantidad: '1.2 kg' },
    { id: 2, nombre: 'Harina de trigo', cantidad: '2 kg' },
    { id: 3, nombre: 'Nutella', cantidad: '350 g' },
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla de lado a lado */}
      
      {/* CAJA INTERIOR: Centrada, con ancho máximo (max-w-5xl) para que no se estire en monitores grandes */}
      <div className="max-w-5xl mx-auto p-6 md:p-8 pb-28 space-y-8">
        
        {/* Encabezado con Usuario y Botón de Cierre de Sesión */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">Heart Desserts</p>
            <h1 className="text-4xl font-serif font-bold text-zinc-900">Inicio</h1>
            <p className="text-xs text-zinc-500 mt-2">
              Sesión: <span className="font-medium text-zinc-700">{user.email}</span>
            </p>
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
        <div className="bg-[#FEF5E7] border border-[#FAD7A1]/60 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-[#8C5A2B] text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Por agotarse · {insumosPorAgotarse.length} insumos
          </h2>
          <div className="space-y-3 text-sm">
            {insumosPorAgotarse.map((item) => (
              <div key={item.id} className="flex justify-between items-center font-medium text-[#6B4420]">
                <span>{item.nombre}</span>
                <span className="font-bold">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta: Vencen pronto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex items-center justify-between transition-all hover:shadow-md">
          <div className="flex gap-3 items-center">
            <div className="bg-rose-50 p-2.5 rounded-full text-[#B83B5E]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">Vencen pronto</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Fresas · en 2 días</p>
            </div>
          </div>
          <Link href="/insumos" className="text-[#B83B5E] text-xs font-bold hover:underline px-2">
            Ver todo
          </Link>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-zinc-800 text-base">¿Qué quieres hacer?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/ventas/nueva" className="bg-[#B83B5E] text-white p-5 rounded-3xl shadow-sm hover:bg-rose-800 active:scale-[0.98] transition-all flex flex-col justify-between h-36">
              <FileText className="w-7 h-7 mb-4 opacity-90" />
              <span className="font-semibold text-sm leading-tight">Registrar<br/>venta</span>
            </Link>
            <Link href="/compras" className="bg-[#FCE4EC] text-[#5C1D2F] p-5 rounded-3xl shadow-sm hover:bg-[#F8BBD0]/80 active:scale-[0.98] transition-all flex flex-col justify-between h-36">
              <ShoppingBag className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
              <span className="font-semibold text-sm leading-tight">Registrar<br/>compra</span>
            </Link>
            <Link href="/produccion/nueva" className="bg-[#FCE4EC] text-[#5C1D2F] p-5 rounded-3xl shadow-sm hover:bg-[#F8BBD0]/80 active:scale-[0.98] transition-all flex flex-col justify-between h-36">
              <PackagePlus className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
              <span className="font-semibold text-sm leading-tight">Producir<br/>tanda</span>
            </Link>
            <Link href="/merma/nueva" className="bg-[#FCE4EC] text-[#5C1D2F] p-5 rounded-3xl shadow-sm hover:bg-[#F8BBD0]/80 active:scale-[0.98] transition-all flex flex-col justify-between h-36">
              <Trash2 className="w-7 h-7 mb-4 text-[#B83B5E] opacity-80" />
              <span className="font-semibold text-sm leading-tight">Registrar<br/>pérdida</span>
            </Link>
          </div>
        </div>

        {/* Accesos a Catálogos */}
        <div className="space-y-4 pt-8 border-t border-zinc-100">
          <h3 className="font-bold text-zinc-800 text-base">Catálogos y gestión</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/insumos" className="bg-white border border-zinc-200 p-4 rounded-2xl flex items-center gap-4 hover:border-rose-300 hover:shadow-sm transition-all group">
              <div className="bg-zinc-50 p-3 rounded-full text-zinc-500 group-hover:text-rose-600 transition-colors"><Package className="w-5 h-5"/></div>
              <div>
                <p className="font-semibold text-zinc-900 text-sm">Insumos</p>
                <p className="text-xs text-zinc-500">Inventario y materias</p>
              </div>
            </Link>
            <Link href="/productos" className="bg-white border border-zinc-200 p-4 rounded-2xl flex items-center gap-4 hover:border-rose-300 hover:shadow-sm transition-all group">
              <div className="bg-zinc-50 p-3 rounded-full text-zinc-500 group-hover:text-rose-600 transition-colors"><Layers className="w-5 h-5"/></div>
              <div>
                <p className="font-semibold text-zinc-900 text-sm">Productos</p>
                <p className="text-xs text-zinc-500">Recetas y costos</p>
              </div>
            </Link>
            <Link href="/proveedores" className="bg-white border border-zinc-200 p-4 rounded-2xl flex items-center gap-4 hover:border-rose-300 hover:shadow-sm transition-all group">
              <div className="bg-zinc-50 p-3 rounded-full text-zinc-500 group-hover:text-rose-600 transition-colors"><Users className="w-5 h-5"/></div>
              <div>
                <p className="font-semibold text-zinc-900 text-sm">Proveedores</p>
                <p className="text-xs text-zinc-500">Contactos y compras</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}