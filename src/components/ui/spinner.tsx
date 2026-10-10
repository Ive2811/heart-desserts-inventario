import { Loader2Icon } from "lucide-react"
import { cn } from "cn"

export function Spinner({ className }: { className?: string }) {
  return <Loader2Icon aria-hidden="true" className={cn("size-4 animate-spin", className)} />
}
