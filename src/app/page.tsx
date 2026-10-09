import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-zinc-500 mt-2">
            Sesión iniciada como: <span className="font-semibold">{user.email}</span>
          </p>
        </div>
        <form action="/signout" method="post">
          <Button variant="outline" type="submit">Cerrar sesión</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Inventario</h3>
            <p className="text-sm text-zinc-500 mt-2">Gestión de insumos y materia prima</p>
          </div>
          <div className="mt-6">
            <Link href="/insumos" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Ir al catálogo &rarr;
            </Link>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Compras</h3>
            <p className="text-sm text-zinc-500 mt-2">Registra lo que compras y suma stock</p>
          </div>
          <div className="mt-6">
            <Link href="/compras" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Ir a compras &rarr;
            </Link>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="font-semibold leading-none tracking-tight">Ventas del Día</h3>
          <p className="text-sm text-zinc-500 mt-2">Ingresos registrados hoy</p>
          <div className="text-2xl font-bold mt-4">$0.00</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="font-semibold leading-none tracking-tight">Producción</h3>
          <p className="text-sm text-zinc-500 mt-2">Lotes en mostrador</p>
          <div className="text-2xl font-bold mt-4">Activa</div>
        </div>
      </div>
    </div>
  )
}