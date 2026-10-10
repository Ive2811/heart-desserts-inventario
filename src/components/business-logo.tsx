import { cn } from 'cn'

// <img> simple a propósito: el logo puede ser una ruta de /public o una URL externa configurada por el administrador
export function BusinessLogo({ src, name, className }: { src: string; name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Logotipo de ${name}`} className={cn('object-cover', className)} />
  )
}
