# Heart Desserts · Inventario

Sistema interno para controlar insumos, recetas, compras, producción, ventas, mermas y corte de caja.

**Stack:** Next.js 16 · React 19 · Supabase en la nube (Postgres + Auth + RLS) · Tailwind 4 · shadcn/ui

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env.local` y llena las tres variables. La `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor
   (módulo `src/lib/supabase/admin.ts`, protegido con `server-only`); nunca lleva prefijo `NEXT_PUBLIC_`.
3. Aplica las migraciones de `supabase/migrations/` **en orden** (`0001` a `0005`). En Supabase en la nube:
   Dashboard → SQL Editor → pega y ejecuta cada archivo, o con la CLI: `npx supabase login`,
   `npx supabase link --project-ref TU_PROJECT_REF` y `npx supabase db push`.
4. Crea el primer usuario en Supabase Auth con correo `usuario@heartdesserts.local` y actívalo como administrador
   (los perfiles nuevos nacen inactivos):

   ```sql
   update public.profiles set role = 'owner', active = true where id = '<uuid del usuario>';
   ```
5. `npm run dev`. Para entrar se escribe solo el usuario (ej. `admin`); el dominio interno se agrega solo.

### Regenerar los tipos de la base (Supabase en la nube)

```bash
npx supabase login
npx supabase gen types typescript --project-id TU_PROJECT_REF --schema public > src/types/database.ts
```

El `PROJECT_REF` está en Supabase → Project Settings → General. En Windows PowerShell el `>` guarda el archivo en
UTF-16 y rompe TypeScript: ejecuta el comando desde `cmd` o usa `| Out-File -Encoding utf8 src/types/database.ts`.

## Seguridad

- `src/proxy.ts` (middleware global): sin sesión → `/login`; `/admin/*` y `/reportes/*` solo para administrador;
  cada módulo exige el permiso del usuario y que el módulo esté activo en la configuración; cuentas inactivas se cierran.
- Segunda barrera en las páginas (`requireOwner`) y en las acciones de servidor; la base de datos aplica RLS.
- Anti-negativos: `CHECK` en Postgres (stock, costos, precios, cantidades) y `min="0"` en los formularios.
- Costos históricos congelados: cada lote guarda su costo (`ingredient_lots.unit_cost`), cada tanda su costo
  (`production_batches`) y cada venta el costo de lo que vendió (`sale_items.unit_cost`).

## Módulos

| Módulo | Ruta |
| --- | --- |
| Ventas (canal, método de pago, extras) | `/ventas/nueva` |
| Corte de caja (Corte Z) | `/caja` |
| Compras | `/compras` |
| Insumos · Productos y recetas · Proveedores | `/insumos` · `/productos` · `/proveedores` |
| Producción de tandas · Pérdidas | `/produccion/nueva` · `/merma/nueva` |
| Reportes (ventas, ventas por día, kardex) | `/reportes` |
| Usuarios y permisos · Configuración del negocio · Catálogos | `/admin/usuarios` · `/admin/configuracion` · `/admin/catalogos` |

Los módulos se pueden activar o desactivar en **Configuración del negocio**. Los reportes y el corte de caja
se imprimen o guardan como PDF con cabecera institucional (logo, nombre, fecha).
