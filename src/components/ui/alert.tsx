import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

// Alertas en línea: error (rojo), éxito (verde), advertencia (ámbar) e informativa (neutra), todas con icono
const VARIANTS = {
  error: {
    Icon: OctagonXIcon,
    box: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-600",
  },
  success: {
    Icon: CircleCheckIcon,
    box: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: "text-emerald-600",
  },
  warning: {
    Icon: TriangleAlertIcon,
    box: "bg-amber-50 border-amber-200 text-amber-800",
    icon: "text-amber-600",
  },
  info: {
    Icon: InfoIcon,
    box: "bg-white border-zinc-200 text-zinc-700",
    icon: "text-zinc-500",
  },
} as const

export function Alert({
  variant = "info",
  className,
  children,
}: {
  variant?: keyof typeof VARIANTS
  className?: string
  children: React.ReactNode
}) {
  const { Icon, box, icon } = VARIANTS[variant]
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium", box, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
