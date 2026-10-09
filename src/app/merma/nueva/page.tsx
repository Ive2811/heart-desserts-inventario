'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegistrarPerdidaPage() {
  const [insumo, setInsumo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirmarPerdida = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!insumo) {
      toast.error('Por favor selecciona qué se te arruinó o venció.')
      return
    }
    if (!cantidad || Number(cantidad) <= 0) {
      toast.error('La cantidad a descartar debe ser mayor a cero.')
      return
    }
    if (!motivo.trim()) {
      toast.error('Escribe rapidito qué pasó (ej. se cayó, se venció).')
      return
    }

    setLoading(true)
    
    // Simulamos el guardado
    await new Promise(resolve => setTimeout(resolve, 1000)) 
    
    toast.success('Pérdida registrada. Ya lo descontamos del inventario.')
    setLoading(false)
    
    // Limpiamos el formulario
    setInsumo('')
    setCantidad('')
    setMotivo('')
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-4xl mx-auto p-6 md:p-10 pb-28 flex flex-col justify-between min-h-screen">
        
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-white p-2 rounded-full border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </Link>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Registrar pérdida</h1>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
              <div className="bg-red-50 p-2.5 rounded-full text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-900">Descartar producto o insumo</h2>
                <p className="text-xs text-zinc-500">Para lo que se arruina, se vence o se cae por accidente.</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarPerdida} className="space-y-5" noValidate>
              
              <div className="space-y-2">
                <Label htmlFor="insumo" className="text-zinc-700 font-semibold">¿Qué vamos a descartar?</Label>
                <select 
                  id="insumo" 
                  value={insumo}
                  onChange={(e) => setInsumo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B83B5E]"
                >
                  <option value="">Selecciona de la lista...</option>
                  <option value="1">Queso crema (g)</option>
                  <option value="2">Fresas (unit)</option>
                  <option value="3">Leche (ml)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad" className="text-zinc-700 font-semibold">¿Cuánto se perdió?</Label>
                  <Input 
                    id="cantidad" 
                    type="number" 
                    step="any" 
                    min="0"
                    placeholder="Ej. 250"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="h-10 focus-visible:ring-[#B83B5E]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-zinc-700 font-semibold">¿Qué pasó?</Label>
                <Input 
                  id="motivo" 
                  placeholder="Ej. Se arruinó en la refri, se me cayó la bandeja..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="h-10 focus-visible:ring-[#B83B5E]" 
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-red-600 text-white hover:bg-red-700 transition-colors h-12 rounded-xl text-base shadow-sm"
                >
                  {loading ? 'Procesando...' : 'Confirmar pérdida'}
                </Button>
              </div>
            </form>
          </div>
          
          <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed">
            Ojo: Al confirmar, esto se descontará de tu inventario para que las cuentas siempre te cuadren.
          </p>
        </div>

      </div>
    </div>
  )
}