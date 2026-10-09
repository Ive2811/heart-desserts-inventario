'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Plus, Minus, Package } from 'lucide-react'

export default function ProducirTandaPage() {
  const [producto, setProducto] = useState('Brownies')
  const [cantidadTandas, setCantidadTandas] = useState(1)
  const [loading, setLoading] = useState(false)

  // Datos ficticios para el diseño
  const unidadesPorTanda = 12 
  const totalUnidades = cantidadTandas * unidadesPorTanda

  const restarCantidad = () => {
    if (cantidadTandas <= 1) {
      toast.error('Debes producir al menos 1 tanda')
      return
    }
    setCantidadTandas(prev => prev - 1)
  }

  const sumarCantidad = () => {
    setCantidadTandas(prev => prev + 1)
  }

  const handleConfirmarProduccion = async () => {
    setLoading(true)
    
    // Simula guardado
    await new Promise(resolve => setTimeout(resolve, 1000)) 
    
    toast.success(`Producción de ${totalUnidades} ${producto} registrada con éxito`)
    setLoading(false)
    setCantidadTandas(1)
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}
      
      {/* CAJA INTERIOR: Centrada, ancho máximo, y min-h-screen para empujar el footer abajo */}
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 flex flex-col justify-between min-h-screen">
        
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </Link>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Producir tanda</h1>
          </div>

          {/* Selección de Producto */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Producto a elaborar</label>
            <div className="flex flex-wrap gap-2">
              {['Brownies', 'Mini Cheesecakes', 'Cupcakes'].map((opcion) => (
                <button 
                  key={opcion}
                  onClick={() => setProducto(opcion)}
                  className={`text-sm font-medium px-5 py-2.5 rounded-full transition-all ${
                    producto === opcion 
                      ? 'bg-[#3A2D2A] text-white shadow-md' 
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta Principal de Producción */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-zinc-900 text-lg">Cantidad de tandas</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Rinde {unidadesPorTanda} unidades por tanda</p>
              </div>
              
              <div className="flex items-center gap-4 border border-zinc-200 rounded-full px-2 py-1 shadow-sm">
                <button onClick={restarCantidad} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm w-4 text-center">{cantidadTandas}</span>
                <button onClick={sumarCantidad} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Resumen dinámico de insumos (Simulado visualmente) */}
            <div className="space-y-2 text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100/80">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5"/> Insumos estimados a descontar
              </p>
              <div className="flex justify-between items-center text-zinc-600 text-xs">
                <span>Harina de trigo</span>
                <span className="font-medium text-zinc-900">{500 * cantidadTandas} g</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 text-xs">
                <span>Azúcar</span>
                <span className="font-medium text-zinc-900">{300 * cantidadTandas} g</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 text-xs">
                <span>Huevos</span>
                <span className="font-medium text-zinc-900">{4 * cantidadTandas} unid.</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
            Al confirmar, los insumos serán descontados de tu inventario y las unidades terminadas se sumarán a tu stock de venta.
          </p>
        </div>

        {/* Pie con Total Fijo */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-6 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-sm font-medium text-zinc-500">Total a vitrina</span>
            <span className="text-4xl font-serif font-bold text-zinc-900">{totalUnidades} <span className="text-base text-zinc-400 font-sans font-medium">unid.</span></span>
          </div>
          <button 
            onClick={handleConfirmarProduccion}
            disabled={loading}
            className="w-full bg-[#B83B5E] text-white font-semibold py-4 rounded-2xl shadow-lg hover:bg-rose-800 active:scale-[0.98] transition-all text-base disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? 'Procesando...' : 'Registrar producción'}
          </button>
        </div>

      </div>
    </div>
  )
}