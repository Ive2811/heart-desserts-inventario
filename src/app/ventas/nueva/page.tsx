'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Plus, Minus, Trash2 } from 'lucide-react'

type CanalVenta = 'Local' | 'WhatsApp' | 'Instagram'

type ItemVenta = {
  id: number
  producto: string
  precioBase: number
  cantidad: number
  extraNutella: boolean
  fresas: boolean
}

export default function RegistrarVentaPage() {
  const [canal, setCanal] = useState<CanalVenta>('Local')
  const [loading, setLoading] = useState(false)

  // Lista interactiva de productos en el carrito
  const [items, setItems] = useState<ItemVenta[]>([
    { id: 1, producto: 'Crepa de Nutella', precioBase: 4.50, cantidad: 1, extraNutella: true, fresas: true }
  ])

  // Precios de los extras
  const precioExtraNutella = 0.75
  const precioFresas = 0.60

  // Agregar otra línea de producto vacía
  const agregarProducto = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), producto: 'Mini Cheesecakes', precioBase: 3.50, cantidad: 1, extraNutella: false, fresas: false }
    ])
    toast.success('Nuevo producto agregado a la venta')
  }

  // Eliminar un producto del carrito
  const eliminarItem = (id: number) => {
    if (items.length === 1) {
      toast.error('La venta debe tener al menos un producto')
      return
    }
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Modificar cantidad
  const cambiarCantidad = (id: number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta
        if (nuevaCantidad < 1) {
          toast.error('La cantidad mínima es 1')
          return item
        }
        return { ...item, cantidad: nuevaCantidad }
      }
      return item
    }))
  }

  // Alternar los extras con los checkboxes interactivos
  const toggleExtra = (id: number, extra: 'extraNutella' | 'fresas') => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [extra]: !item[extra] }
      }
      return item
    }))
  }

  // Cálculo dinámico del total de todo el carrito
  const total = items.reduce((sum, item) => {
    let subtotal = item.precioBase
    if (item.extraNutella) subtotal += precioExtraNutella
    if (item.fresas) subtotal += precioFresas
    return sum + (subtotal * item.cantidad)
  }, 0)

  const handleConfirmarVenta = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) 
    
    toast.success(`Venta de $${total.toFixed(2)} registrada por ${canal} con éxito`)
    setLoading(false)
    
    // Reiniciamos a un producto por defecto
    setItems([{ id: 1, producto: 'Crepa de Nutella', precioBase: 4.50, cantidad: 1, extraNutella: true, fresas: true }])
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}
      
      {/* CAJA INTERIOR: Centrada, ancho máximo, y min-h-screen para empujar el footer abajo */}
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-32 flex flex-col justify-between min-h-screen">
        
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

          {/* Lista Dinámica de Productos en el Carrito */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 space-y-4 relative">
                
                {/* Botón para quitar producto si hay más de uno */}
                {items.length > 1 && (
                  <button 
                    onClick={() => eliminarItem(item.id)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="flex justify-between items-start pr-8">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg">{item.producto}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">${item.precioBase.toFixed(2)} c/u</p>
                  </div>
                  
                  <div className="flex items-center gap-3 border border-zinc-200 rounded-full px-2 py-1 shadow-sm bg-zinc-50">
                    <button onClick={() => cambiarCantidad(item.id, -1)} className="p-1 hover:bg-zinc-200 rounded-full text-zinc-700 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-sm w-4 text-center">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, 1)} className="p-1 hover:bg-zinc-200 rounded-full text-zinc-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <hr className="border-zinc-100" />

                {/* Extras con Checkboxes Interactivos */}
                <div className="space-y-3 text-sm">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Extras (por unidad)</p>
                  
                  <label className="flex justify-between items-center text-zinc-700 cursor-pointer select-none">
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        checked={item.extraNutella} 
                        onChange={() => toggleExtra(item.id, 'extraNutella')}
                        className="accent-[#B83B5E] w-4 h-4 rounded border-zinc-300 cursor-pointer" 
                      />
                      <span className="font-medium">Extra Nutella</span>
                    </div>
                    <span className="text-zinc-500 text-xs">+ ${precioExtraNutella.toFixed(2)}</span>
                  </label>

                  <label className="flex justify-between items-center text-zinc-700 cursor-pointer select-none">
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        checked={item.fresas} 
                        onChange={() => toggleExtra(item.id, 'fresas')}
                        className="accent-[#B83B5E] w-4 h-4 rounded border-zinc-300 cursor-pointer" 
                      />
                      <span className="font-medium">Fresas</span>
                    </div>
                    <span className="text-zinc-500 text-xs">+ ${precioFresas.toFixed(2)}</span>
                  </label>
                </div>

              </div>
            ))}
          </div>

          {/* Botón para agregar otro producto */}
          <button 
            onClick={agregarProducto}
            className="w-full border-2 border-dashed border-rose-200 text-[#B83B5E] font-semibold py-4 rounded-2xl text-sm hover:bg-rose-50/50 active:scale-[0.98] transition-all shadow-sm"
          >
            + Agregar otro producto
          </button>

          <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
            Al confirmar, se descuentan del inventario los insumos de la receta y los extras elegidos.
          </p>
        </div>

        {/* Pie con Total Fijo en vivo */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] p-6 border-t border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-sm font-medium text-zinc-500">Total a pagar</span>
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
    </div>
  )
}