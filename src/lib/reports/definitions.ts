import { dateKeySV, formatDateTimeSV } from '@/lib/reports/dates'
import { MOVEMENT_LABEL, PAYMENT_LABEL, REASON_LABEL, UNIT_LABEL } from '@/lib/labels'
import { formatDMY, rangeIso } from './params'
import type { Cell, ReportDef } from './types'

const LIMIT = 5000
const NOTE_LIMIT = `Se muestran hasta ${LIMIT.toLocaleString('es-SV')} registros por reporte; acota el rango de fechas si necesitas ver menos.`

function sum(values: number[]) {
  return Math.round(values.reduce((a, b) => a + b, 0) * 10000) / 10000
}

export const REPORTS: ReportDef[] = [
  // ---------------------------------------------------------------------------
  {
    id: 'ventas',
    title: 'Ventas detalladas',
    description: 'Qué se vendió en cada transacción, con costo y ganancia real por venta.',
    usesRange: true,
    async load(supabase, params) {
      const { start, end } = rangeIso(params)
      const [{ data: ventas, error }, { data: canales }] = await Promise.all([
        supabase
          .from('sales')
          .select('sold_at, channel, customer_name, status, total, payment_method, sale_items(quantity, unit_cost, products(name))')
          .gte('sold_at', start)
          .lt('sold_at', end)
          .order('sold_at', { ascending: false })
          .limit(LIMIT),
        supabase.from('sale_channels').select('code, label'),
      ])
      if (error) throw new Error(error.message)

      const canalPorCodigo = new Map((canales ?? []).map((c) => [c.code, c.label]))

      const rows = (ventas ?? []).map((v) => {
        const completada = v.status === 'completed'
        const costo = completada ? sum(v.sale_items.map((i) => i.quantity * Number(i.unit_cost))) : 0
        const total = Number(v.total)
        return {
          fecha: formatDateTimeSV(v.sold_at),
          canal: canalPorCodigo.get(v.channel) ?? v.channel,
          cliente: v.customer_name || 'Cliente general',
          pago: PAYMENT_LABEL[v.payment_method] ?? v.payment_method,
          detalle: v.sale_items.map((i) => `${i.quantity} × ${i.products?.name ?? 'Producto'}`).join(', '),
          estado: completada ? 'Completada' : 'Anulada',
          total,
          costo,
          ganancia: completada ? Math.round((total - costo) * 100) / 100 : 0,
          _completada: completada ? 1 : 0,
        } as Record<string, Cell>
      })

      const ok = rows.filter((r) => r._completada === 1)
      return {
        title: 'Ventas detalladas',
        subtitle: `Del ${formatDMY(params.desde)} al ${formatDMY(params.hasta)}`,
        orientation: 'landscape',
        columns: [
          { key: 'fecha', header: 'Fecha y hora', weight: 1.1 },
          { key: 'canal', header: 'Canal', weight: 0.8 },
          { key: 'cliente', header: 'Cliente', weight: 1 },
          { key: 'pago', header: 'Pago', weight: 0.9 },
          { key: 'detalle', header: 'Qué se vendió', weight: 2.6 },
          { key: 'estado', header: 'Estado', weight: 0.9 },
          { key: 'total', header: 'Total', type: 'money', weight: 0.9 },
          { key: 'costo', header: 'Costo', type: 'money', weight: 0.9 },
          { key: 'ganancia', header: 'Ganancia', type: 'money', weight: 0.9 },
        ],
        rows,
        totals: {
          fecha: 'Totales (solo ventas completadas)',
          total: sum(ok.map((r) => Number(r.total))),
          costo: sum(ok.map((r) => Number(r.costo))),
          ganancia: sum(ok.map((r) => Number(r.ganancia))),
        },
        note: `El costo es el que quedó congelado al momento de vender. ${NOTE_LIMIT}`,
      }
    },
  },

  // ---------------------------------------------------------------------------
  {
    id: 'ventas-por-dia',
    title: 'Ventas por día',
    description: 'Ingresos, costo y ganancia de cada día, separados por forma de pago.',
    usesRange: true,
    async load(supabase, params) {
      const { start, end } = rangeIso(params)
      const { data, error } = await supabase
        .from('sales')
        .select('sold_at, total, payment_method, sale_items(quantity, unit_cost)')
        .eq('status', 'completed')
        .gte('sold_at', start)
        .lt('sold_at', end)
        .limit(LIMIT)
      if (error) throw new Error(error.message)

      const dias = new Map<string, { n: number; cash: number; card: number; transfer: number; total: number; costo: number }>()
      for (const v of data ?? []) {
        const key = dateKeySV(v.sold_at)
        const d = dias.get(key) ?? { n: 0, cash: 0, card: 0, transfer: 0, total: 0, costo: 0 }
        const total = Number(v.total)
        d.n += 1
        d.total += total
        d.costo += sum(v.sale_items.map((i) => i.quantity * Number(i.unit_cost)))
        if (v.payment_method === 'cash') d.cash += total
        else if (v.payment_method === 'card') d.card += total
        else d.transfer += total
        dias.set(key, d)
      }

      const rows = [...dias.entries()]
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([key, d]) => ({
          fecha: formatDMY(key),
          ventas: d.n,
          efectivo: sum([d.cash]),
          tarjeta: sum([d.card]),
          transferencia: sum([d.transfer]),
          total: sum([d.total]),
          costo: sum([d.costo]),
          ganancia: sum([d.total - d.costo]),
        })) as Record<string, Cell>[]

      const col = (k: string) => sum(rows.map((r) => Number(r[k])))
      return {
        title: 'Ventas por día',
        subtitle: `Del ${formatDMY(params.desde)} al ${formatDMY(params.hasta)}`,
        orientation: 'landscape',
        columns: [
          { key: 'fecha', header: 'Fecha' },
          { key: 'ventas', header: 'Ventas', type: 'number' },
          { key: 'efectivo', header: 'Efectivo', type: 'money' },
          { key: 'tarjeta', header: 'Tarjeta', type: 'money' },
          { key: 'transferencia', header: 'Transferencia', type: 'money' },
          { key: 'total', header: 'Total', type: 'money' },
          { key: 'costo', header: 'Costo', type: 'money' },
          { key: 'ganancia', header: 'Ganancia', type: 'money' },
        ],
        rows,
        totals: {
          fecha: 'Totales',
          ventas: col('ventas'),
          efectivo: col('efectivo'),
          tarjeta: col('tarjeta'),
          transferencia: col('transferencia'),
          total: col('total'),
          costo: col('costo'),
          ganancia: col('ganancia'),
        },
        note: 'Los días se cuentan en hora de El Salvador. Solo incluye ventas completadas (las anuladas no suman).',
      }
    },
  },

  // ---------------------------------------------------------------------------
  {
    id: 'kardex',
    title: 'Kardex de insumos',
    description: 'Entradas y salidas de materia prima: compras, producción, ventas, pérdidas y ajustes.',
    usesRange: true,
    async load(supabase, params) {
      const { start, end } = rangeIso(params)
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('created_at, type, quantity, unit_cost, reason, note, ingredients(name, base_unit)')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false })
        .limit(LIMIT)
      if (error) throw new Error(error.message)

      const rows = (data ?? []).map((m) => {
        const cantidad = Number(m.quantity)
        const costoUnit = Number(m.unit_cost)
        return {
          fecha: formatDateTimeSV(m.created_at),
          insumo: m.ingredients?.name ?? '—',
          tipo: MOVEMENT_LABEL[m.type] ?? m.type,
          cantidad,
          unidad: UNIT_LABEL[m.ingredients?.base_unit ?? ''] ?? '',
          costo_unitario: costoUnit,
          valor: Math.round(cantidad * costoUnit * 100) / 100,
          detalle: m.reason || m.note || '',
        } as Record<string, Cell>
      })

      return {
        title: 'Kardex de insumos',
        subtitle: `Del ${formatDMY(params.desde)} al ${formatDMY(params.hasta)}`,
        orientation: 'landscape',
        columns: [
          { key: 'fecha', header: 'Fecha y hora', weight: 1.2 },
          { key: 'insumo', header: 'Insumo', weight: 1.5 },
          { key: 'tipo', header: 'Movimiento', weight: 1 },
          { key: 'cantidad', header: 'Cantidad', type: 'number', weight: 0.9 },
          { key: 'unidad', header: 'Unidad', weight: 0.6 },
          { key: 'costo_unitario', header: 'Costo unitario', type: 'money4', weight: 1 },
          { key: 'valor', header: 'Valor', type: 'money', weight: 0.9 },
          { key: 'detalle', header: 'Detalle', weight: 1.6 },
        ],
        rows,
        note: `Las cantidades negativas son salidas. ${NOTE_LIMIT}`,
      }
    },
  },

  // ---------------------------------------------------------------------------
  {
    id: 'inventario-valorizado',
    title: 'Inventario valorizado',
    description: 'Cuánto dinero hay en existencias hoy: insumos y productos terminados.',
    usesRange: false,
    async load(supabase) {
      const [{ data: insumos, error }, { data: productos }] = await Promise.all([
        supabase
          .from('ingredients')
          .select('name, base_unit, current_stock, min_stock, avg_cost')
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('name, current_stock, avg_cost')
          .eq('active', true)
          .eq('fulfillment', 'made_to_stock')
          .gt('current_stock', 0)
          .order('name', { ascending: true }),
      ])
      if (error) throw new Error(error.message)

      const filasInsumos = (insumos ?? []).map((i) => {
        const stock = Number(i.current_stock)
        const costo = Number(i.avg_cost)
        return {
          tipo: 'Insumo',
          nombre: i.name,
          existencia: stock,
          unidad: UNIT_LABEL[i.base_unit] ?? i.base_unit,
          costo_promedio: costo,
          valor: Math.round(stock * costo * 100) / 100,
          estado: stock <= 0 ? 'Sin stock' : Number(i.min_stock) > 0 && stock <= Number(i.min_stock) ? 'Crítico' : 'Óptimo',
        } as Record<string, Cell>
      })
      const filasProductos = (productos ?? []).map((p) => {
        const stock = p.current_stock
        const costo = Number(p.avg_cost)
        return {
          tipo: 'Producto terminado',
          nombre: p.name,
          existencia: stock,
          unidad: 'unid',
          costo_promedio: costo,
          valor: Math.round(stock * costo * 100) / 100,
          estado: 'Óptimo',
        } as Record<string, Cell>
      })

      const rows = [...filasInsumos, ...filasProductos]
      return {
        title: 'Inventario valorizado',
        subtitle: 'Existencias actuales valoradas a costo promedio',
        orientation: 'portrait',
        columns: [
          { key: 'tipo', header: 'Tipo', weight: 1.2 },
          { key: 'nombre', header: 'Nombre', weight: 2 },
          { key: 'existencia', header: 'Existencia', type: 'number', weight: 1 },
          { key: 'unidad', header: 'Unidad', weight: 0.7 },
          { key: 'costo_promedio', header: 'Costo prom.', type: 'money4', weight: 1 },
          { key: 'valor', header: 'Valor', type: 'money', weight: 1 },
          { key: 'estado', header: 'Estado', weight: 0.9 },
        ],
        rows,
        totals: { tipo: 'Valor total del inventario', valor: sum(rows.map((r) => Number(r.valor))) },
      }
    },
  },

  // ---------------------------------------------------------------------------
  {
    id: 'compras-por-proveedor',
    title: 'Compras por proveedor',
    description: 'Cuánto se le compró a cada proveedor en el período.',
    usesRange: true,
    async load(supabase, params) {
      const { data, error } = await supabase
        .from('purchases')
        .select('total, suppliers(name)')
        .gte('purchased_on', params.desde)
        .lte('purchased_on', params.hasta)
        .limit(LIMIT)
      if (error) throw new Error(error.message)

      const porProveedor = new Map<string, { n: number; total: number }>()
      for (const c of data ?? []) {
        const nombre = c.suppliers?.name ?? 'Sin proveedor'
        const actual = porProveedor.get(nombre) ?? { n: 0, total: 0 }
        porProveedor.set(nombre, { n: actual.n + 1, total: actual.total + Number(c.total) })
      }
      const granTotal = sum([...porProveedor.values()].map((p) => p.total))

      const rows = [...porProveedor.entries()]
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([nombre, p]) => ({
          proveedor: nombre,
          compras: p.n,
          total: sum([p.total]),
          porcentaje: granTotal > 0 ? Math.round((p.total / granTotal) * 1000) / 10 : 0,
        })) as Record<string, Cell>[]

      return {
        title: 'Compras por proveedor',
        subtitle: `Del ${formatDMY(params.desde)} al ${formatDMY(params.hasta)}`,
        orientation: 'portrait',
        columns: [
          { key: 'proveedor', header: 'Proveedor', weight: 2.5 },
          { key: 'compras', header: 'Compras', type: 'number' },
          { key: 'total', header: 'Total comprado', type: 'money' },
          { key: 'porcentaje', header: '% del total', type: 'number' },
        ],
        rows,
        totals: { proveedor: 'Total del período', compras: sum(rows.map((r) => Number(r.compras))), total: granTotal },
      }
    },
  },

  // ---------------------------------------------------------------------------
  {
    id: 'perdidas',
    title: 'Pérdidas y descartes',
    description: 'Insumos vencidos, dañados o desperdiciados, con su costo.',
    usesRange: true,
    async load(supabase, params) {
      const { start, end } = rangeIso(params)
      const { data, error } = await supabase
        .from('wastage_logs')
        .select('created_at, quantity, cost_lost, reason_code, note, ingredients(name, base_unit)')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false })
        .limit(LIMIT)
      if (error) throw new Error(error.message)

      const rows = (data ?? []).map((w) => ({
        fecha: formatDateTimeSV(w.created_at),
        insumo: w.ingredients?.name ?? '—',
        cantidad: Number(w.quantity),
        unidad: UNIT_LABEL[w.ingredients?.base_unit ?? ''] ?? '',
        motivo: REASON_LABEL[w.reason_code] ?? w.reason_code,
        costo: Number(w.cost_lost),
        detalle: w.note ?? '',
      })) as Record<string, Cell>[]

      return {
        title: 'Pérdidas y descartes',
        subtitle: `Del ${formatDMY(params.desde)} al ${formatDMY(params.hasta)}`,
        orientation: 'landscape',
        columns: [
          { key: 'fecha', header: 'Fecha y hora', weight: 1.2 },
          { key: 'insumo', header: 'Insumo', weight: 1.6 },
          { key: 'cantidad', header: 'Cantidad', type: 'number' },
          { key: 'unidad', header: 'Unidad', weight: 0.6 },
          { key: 'motivo', header: 'Motivo', weight: 1.2 },
          { key: 'costo', header: 'Costo perdido', type: 'money' },
          { key: 'detalle', header: 'Detalle', weight: 1.8 },
        ],
        rows,
        totals: { fecha: 'Total perdido', costo: sum(rows.map((r) => Number(r.costo))) },
      }
    },
  },
]

export function getReport(id: string): ReportDef | undefined {
  return REPORTS.find((r) => r.id === id)
}
