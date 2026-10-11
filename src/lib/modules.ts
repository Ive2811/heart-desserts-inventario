// Módulos con permiso por usuario (los marca el administrador al crear o editar a alguien)
export const MODULOS = [
  { id: 'ventas', label: 'Ventas', desc: 'Registrar ventas y consultar transacciones' },
  { id: 'caja', label: 'Corte de caja', desc: 'Cerrar la caja del día (fondo inicial, efectivo y pagos digitales)' },
  { id: 'compras', label: 'Compras', desc: 'Registrar compras a proveedores y facturas' },
  { id: 'insumos', label: 'Catálogo de insumos', desc: 'Ver y agregar materias primas' },
  { id: 'productos', label: 'Productos y recetas', desc: 'Gestionar postres, precios y costos' },
  { id: 'produccion', label: 'Producción de tandas', desc: 'Hornear lotes y actualizar vitrina' },
  { id: 'merma', label: 'Pérdidas y descartes', desc: 'Registrar insumos vencidos o dañados' },
  { id: 'proveedores', label: 'Proveedores', desc: 'Gestionar contactos de proveedores' },
  { id: 'usuarios', label: 'Usuarios y permisos', desc: 'Control total de accesos del personal' },
] as const

export const MODULO_IDS: string[] = MODULOS.map((m) => m.id)

// Módulos que el administrador puede activar o desactivar para todo el negocio (Configuración)
export const MODULOS_SISTEMA = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'caja', label: 'Corte de caja' },
  { id: 'compras', label: 'Compras' },
  { id: 'insumos', label: 'Insumos' },
  { id: 'productos', label: 'Productos y recetas' },
  { id: 'produccion', label: 'Producción' },
  { id: 'merma', label: 'Pérdidas y descartes' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'reportes', label: 'Reportes' },
] as const

export const MODULOS_SISTEMA_IDS: string[] = MODULOS_SISTEMA.map((m) => m.id)

// Qué prefijo de ruta pertenece a qué módulo
export const RUTA_A_MODULO: ReadonlyArray<readonly [string, string]> = [
  ['/ventas', 'ventas'],
  ['/caja', 'caja'],
  ['/compras', 'compras'],
  ['/insumos', 'insumos'],
  ['/inventario-fisico', 'insumos'],
  ['/productos', 'productos'],
  ['/produccion', 'produccion'],
  ['/merma', 'merma'],
  ['/proveedores', 'proveedores'],
  ['/reportes', 'reportes'],
]

// Rutas solo para administrador: un empleado que las escriba a mano vuelve al inicio
export const RUTAS_SOLO_ADMIN: readonly string[] = ['/admin', '/reportes']

export const coincideRuta = (path: string, prefijo: string) => path === prefijo || path.startsWith(prefijo + '/')
