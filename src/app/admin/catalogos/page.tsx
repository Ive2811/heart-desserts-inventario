import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { requireOwner } from '@/lib/auth-utils'
import { CatalogManager } from './catalog-manager'
import {
  createCategory, renameCategory, toggleCategory, deleteCategory,
  createChannel, renameChannel, toggleChannel, deleteChannel,
} from './actions'

export default async function CatalogosPage() {
  await requireOwner()
  const supabase = await createClient()

  const [{ data: categorias, error: errCategorias }, { data: canales, error: errCanales }] = await Promise.all([
    supabase.from('product_categories').select('id, name, active').order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('sale_channels').select('code, label, active').order('sort_order', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-[#FDFBF7] w-full">
      <div className="max-w-3xl mx-auto p-6 md:p-10 pb-28 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-zinc-900">Catálogos maestros</h1>
            <p className="text-sm text-zinc-500 mt-1">Crea, renombra, desactiva o borra las listas que usa el sistema.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white hover:bg-zinc-50 transition-colors">Volver al panel</Button>
          </Link>
        </div>

        {(errCategorias || errCanales) && (
          <Alert variant="error">No se pudieron cargar los catálogos. Verifica que la migración 0005 esté aplicada en Supabase.</Alert>
        )}

        <CatalogManager
          title="Categorías de productos"
          description="Agrupan tus postres en el catálogo de productos."
          items={(categorias ?? []).map((c) => ({ id: c.id, label: c.name, active: c.active }))}
          addPlaceholder="ej. Galletas"
          create={createCategory}
          rename={renameCategory}
          toggle={toggleCategory}
          remove={deleteCategory}
        />

        <CatalogManager
          title="Canales de venta"
          description="Por dónde te llegan las ventas. Solo los activos aparecen al registrar una venta."
          items={(canales ?? []).map((c) => ({ id: c.code, label: c.label, active: c.active }))}
          addPlaceholder="ej. Tienda en línea"
          create={createChannel}
          rename={renameChannel}
          toggle={toggleChannel}
          remove={deleteChannel}
        />
      </div>
    </div>
  )
}
