import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
      <Spinner className="size-6 text-[#B83B5E]" />
      <p className="text-sm">Cargando...</p>
    </div>
  )
}
