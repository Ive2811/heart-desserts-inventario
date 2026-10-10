'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// Botón de envío para formularios con acción de servidor: se deshabilita y muestra el spinner mientras guarda
export function SubmitButton({
  children,
  pendingText = 'Guardando...',
  className,
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Spinner /> {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
