'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function DownloadButton() {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-[#B83B5E] text-white hover:bg-rose-800 transition-colors shadow-sm border-none flex items-center gap-2 print:hidden"
    >
      <Printer className="w-4 h-4" />
      Descargar / imprimir PDF
    </Button>
  )
}