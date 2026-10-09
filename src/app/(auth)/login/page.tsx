import { Suspense } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Heart Desserts</CardTitle>
          <CardDescription>Ingresa a tu sistema de inventario.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-sm text-zinc-500">Cargando...</div>}>
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input 
                  id="username" 
                  name="username" 
                  type="text" 
                  placeholder="ej. admin" 
                  required 
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                />
              </div>
              
              {params.error && (
                <p className="text-sm text-red-500 font-medium">{params.error}</p>
              )}

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}