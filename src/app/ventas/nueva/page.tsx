'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Plus, Minus } from 'lucide-react'

type CanalVenta = 'Local' | 'WhatsApp' | 'Instagram'

export default function RegistrarVentaPage() {
  const [canal, setCanal] = useState<CanalVenta>('Local')
  const [cantidad, setCantidad] = useState(1)
  const [loading, setLoading] = useState(false)

  // Precios base para esta prueba visual
  const precioBase = 4.50
  const precioExtraNutella = 0.75
  const precioFresas = 0.60
  
  // Cálculo automático
  const total = (precioBase + precioExtraNutella + precioFresas) * cantidad

  const restarCantidad = () => {
    if (cantidad <= 1) {
      toast.error('La cantidad mínima es 1')
      return
    }
    setCantidad(prev => prev - 1)
  }

  const sumarCantidad = () => {
    setCantidad(prev => prev + 1)
  }

  const handleConfirmarVenta = async () => {
    setLoading(true)
    
    // Simulamos que se guarda en Supabase por 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000)) 
    
    toast.success(`Venta de $${total.toFixed(2)} registrada por ${canal} con éxito`)
    setLoading(false)
    setCantidad(1) // Reiniciamos el contador a 1
  }

  return (
<div className="min-h-screen bg-[#FDFBF7] p-6 pb-28 max-w-4xl mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Registrar venta</h1>
        </div>

        {/* Selección de Canal */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Canal</label>
          <div className="flex gap-2">
            {(['Local', 'WhatsApp', 'Instagram'] as CanalVenta[]).map((opcion) => (
              <button 
                key={opcion}
                onClick={() => setCanal(opcion)}
                className={`text-sm font-medium px-5 py-2.5 rounded-full transition-all ${
                  canal === opcion 
                    ? 'bg-[#3A2D2A] text-white shadow-md' 
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta de Producto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-zinc-900 text-lg">Crepa de Nutella</h3>
              <p className="text-xs text-zinc-500 mt-0.5">${precioBase.toFixed(2)} c/u</p>
            </div>
            
            <div className="flex items-center gap-4 border border-zinc-200 rounded-full px-2 py-1 shadow-sm">
              <button onClick={restarCantidad} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-sm w-4 text-center">{cantidad}</span>
              <button onClick={sumarCantidad} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Extras */}
          <div className="space-y-2 text-sm">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Extras (por unidad)</p>
            <div className="flex justify-between items-center text-zinc-700">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="accent-rose-600 w-4 h-4 rounded border-zinc-300" />
                <span>Extra Nutella</span>
              </div>
              <span className="font-medium text-zinc-500">+ ${precioExtraNutella.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-700">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="accent-rose-600 w-4 h-4 rounded border-zinc-300" />
                <span>Fresas</span>
              </div>
              <span className="font-medium text-zinc-500">+ ${precioFresas.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button className="w-full border-2 border-dashed border-rose-200 text-[#B83B5E] font-semibold py-4 rounded-2xl text-sm hover:bg-rose-50/50 active:scale-[0.98] transition-all">
          + Agregar otro producto
        </button>

        <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
          Al confirmar, se descuentan del inventario los insumos de la receta y los extras elegidos.
        </p>
      </div>

      {/* Pie con Total Fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-6 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0">
        <div className="flex justify-between items-center px-2 mb-4">
          <span className="text-sm font-medium text-zinc-500">Total</span>
          <span className="text-4xl font-serif font-bold text-zinc-900">${total.toFixed(2)}</span>
        </div>
        <button 
          onClick={handleConfirmarVenta}
          disabled={loading}
          className="w-full bg-[#B83B5E] text-white font-semibold py-4 rounded-2xl shadow-lg hover:bg-rose-800 active:scale-[0.98] transition-all text-base disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
        >
          {loading ? 'Procesando...' : 'Confirmar venta'}
        </button>
      </div>
    </div>
  )
}