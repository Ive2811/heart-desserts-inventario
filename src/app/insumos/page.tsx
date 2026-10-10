import { getSettings } from '@/lib/settings'
import { formatMoney } from '@/lib/business'
import { NuevoInsumoModal } from './nuevo-insumo-modal'
import { createClient } from '@/lib/supabase/server'
import { checkIsOwner } from '@/lib/auth-utils'
import { UNIT_LABEL } from '@/lib/labels'
import { StatusBadge, expiryStatus, stockStatus } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'

export default async function InsumosPage() {
  const supabase = await createClient()
  const { currency_symbol } = await getSettings()
  const isOwner = await checkIsOwner()

  const [{ data: insumos, error }, { data: porVencer }] = await Promise.all([
    supabase.from('ingredients').select('*').order('name', { ascending: true }),
    supabase.from('v_expiring_lots').select('ingredient_id, days_left'),
  ])

  // Días que le quedan al lote más próximo a vencer de cada insumo
  const diasPorVencer = new Map<string, number>()
  for (const lote of porVencer ?? []) {
    if (!lote.ingredient_id || lote.days_left === null) continue
    const actual = diasPorVencer.get(lote.ingredient_id)
    if (actual === undefined || lote.days_left < actual) diasPorVencer.set(lote.ingredient_id, lote.days_left)
  }
  const vencimiento = (id: string) => {
    const dias = diasPorVencer.get(id)
    return dias === undefined ? null : expiryStatus(dias)
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      {/* CAJA EXTERIOR: Fondo crema que ocupa toda la pantalla */}

      {/* CAJA INTERIOR: Centrada y con ancho máximo */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Catálogo de insumos</h1>
            <p className="text-sm text-zinc-500 mt-1">Gestiona las existencias de tu materia prima.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
            </Link>
            {isOwner && <NuevoInsumoModal />}
          </div>
        </div>

        {error && (
          <Alert variant="error">
            No se pudieron cargar los insumos. Intenta recargar la página.
          </Alert>
        )}

        {/* Tabla de Insumos */}
        <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Nombre</TableHead>
                <TableHead className="font-semibold text-zinc-700">Unidad base</TableHead>
                <TableHead className="font-semibold text-zinc-700">Costo promedio</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700">Stock actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos && insumos.length > 0 ? (
                insumos.map((insumo) => (
                  <TableRow key={insumo.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-medium text-zinc-900">
                      {insumo.name}
                      {insumo.conversion_factor !== 1 && (
                        <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                          1 {insumo.purchase_unit} = {Number(insumo.conversion_factor)} {UNIT_LABEL[insumo.base_unit]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">{UNIT_LABEL[insumo.base_unit]}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{formatMoney(Number(insumo.avg_cost), currency_symbol, 4)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={stockStatus(Number(insumo.current_stock), Number(insumo.min_stock))} />
                        <StatusBadge status={vencimiento(insumo.id)} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900">
                      {Number(insumo.current_stock)} {UNIT_LABEL[insumo.base_unit]}
                      {Number(insumo.min_stock) > 0 && (
                        <span className="block text-xs font-normal text-zinc-500">mín. {Number(insumo.min_stock)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                    No hay insumos registrados en la base de datos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  )
}