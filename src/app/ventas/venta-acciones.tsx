'use client'

import { cancelSale, reopenDay } from './actions'
import { ReasonDialogButton } from './reason-dialog-button'

export function AnularVentaButton({ saleId }: { saleId: string }) {
  return (
    <ReasonDialogButton
      triggerText="Anular"
      title="Anular venta"
      description="Los insumos y el stock de esta venta regresarán al inventario. La venta queda registrada como anulada y esta acción no se puede deshacer."
      confirmText="Anular venta"
      pendingText="Anulando..."
      successMessage="Venta anulada"
      action={(reason) => cancelSale(saleId, reason)}
    />
  )
}

export function ReabrirDiaButton({ date }: { date: string }) {
  return (
    <ReasonDialogButton
      triggerText="Reabrir día"
      triggerVariant="default"
      title="Reabrir el día"
      description="El corte de caja actual quedará guardado en el historial y se podrán registrar o anular ventas de nuevo. Al terminar, deberás cerrar la caja otra vez."
      confirmText="Reabrir día"
      pendingText="Reabriendo..."
      successMessage="Día reabierto"
      action={(reason) => reopenDay(date, reason)}
    />
  )
}
