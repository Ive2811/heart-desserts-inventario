import { Suspense } from 'react'
import { login } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessLogo } from '@/components/business-logo'
import { getSettings } from '@/lib/settings'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const settings = await getSettings()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-4">
      <Card className="w-full max-w-sm bg-white border border-rose-100 shadow-sm">
        <CardHeader className="items-center text-center space-y-3">
          <BusinessLogo
            src={settings.logo_url}
            name={settings.business_name}
            className="w-20 h-20 rounded-full border border-rose-100 bg-white shadow-sm"
          />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-serif font-bold text-zinc-900">{settings.business_name}</CardTitle>
            <CardDescription>{settings.tagline || 'Ingresa a tu sistema de inventario.'}</CardDescription>
          </div>
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
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {params.error && (
                <Alert variant="error">{params.error}</Alert>
              )}

              <SubmitButton pendingText="Entrando..." className="w-full bg-[#B83B5E] hover:bg-rose-800 text-white">
                Entrar
              </SubmitButton>
            </form>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
