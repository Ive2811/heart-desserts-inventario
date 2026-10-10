-- =============================================================================
-- Heart Desserts · Migración 0005
--   1. business_settings: identidad del negocio y módulos activos (una sola fila)
--   2. sale_channels: canales de venta editables (reemplaza el enum sale_channel)
--   3. sales.payment_method + register_sale con método de pago
--   4. cash_closings: corte de caja diario (Corte Z), solo se escribe con register_cash_closing
--   5. Borrado permitido (solo administrador) en categorías y canales
--   6. CHECK anti-negativos que faltaban en costos de movimientos
--   7. Respaldo de permisos: empleados existentes conservan acceso a los módulos operativos
-- No modifica 0001-0004: las complementa.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Configuración del negocio
-- -----------------------------------------------------------------------------
create table public.business_settings (
  id              boolean primary key default true check (id),   -- fuerza una sola fila
  business_name   text    not null default 'Heart Desserts' check (length(btrim(business_name)) between 1 and 80),
  tagline         text    not null default '' check (length(tagline) <= 160),
  currency_symbol text    not null default '$' check (length(btrim(currency_symbol)) between 1 and 5),
  logo_url        text    not null default '/logo.png' check (length(logo_url) <= 500),
  enabled_modules jsonb   not null default '["ventas","caja","compras","insumos","productos","produccion","merma","proveedores","reportes"]'::jsonb
                  check (jsonb_typeof(enabled_modules) = 'array'),
  updated_at      timestamptz not null default now()
);
create trigger trg_business_settings_updated before update on public.business_settings
  for each row execute function public.set_updated_at();
insert into public.business_settings default values;

alter table public.business_settings enable row level security;
-- Lectura pública: el login necesita mostrar nombre y logo antes de iniciar sesión
create policy business_settings_select on public.business_settings for select to anon, authenticated using (true);
create policy business_settings_update on public.business_settings for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
grant select on public.business_settings to anon, authenticated;
grant update (business_name, tagline, currency_symbol, logo_url, enabled_modules) on public.business_settings to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Canales de venta editables
-- -----------------------------------------------------------------------------
create table public.sale_channels (
  code       text primary key check (code ~ '^[a-z0-9_]{1,30}$'),
  label      text not null check (length(btrim(label)) between 1 and 40),
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index sale_channels_label_uq on public.sale_channels (lower(label));
create trigger trg_sale_channels_updated before update on public.sale_channels
  for each row execute function public.set_updated_at();
insert into public.sale_channels (code, label, sort_order) values
  ('local', 'Local', 1), ('whatsapp', 'WhatsApp', 2), ('instagram', 'Instagram', 3), ('other', 'Otro', 4);

alter table public.sale_channels enable row level security;
create policy sale_channels_select on public.sale_channels for select to authenticated using (public.is_active_user());
create policy sale_channels_insert on public.sale_channels for insert to authenticated with check (public.is_owner());
create policy sale_channels_update on public.sale_channels for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy sale_channels_delete on public.sale_channels for delete to authenticated using (public.is_owner());
grant select on public.sale_channels to authenticated;
grant insert (code, label, sort_order) on public.sale_channels to authenticated;
grant update (label, sort_order, active) on public.sale_channels to authenticated;
grant delete on public.sale_channels to authenticated;

-- El canal de la venta pasa de enum a texto con llave foránea al catálogo
drop function public.register_sale(public.sale_channel, text, text, jsonb, public.invoice_type, text, text, text, jsonb);

alter table public.sales alter column channel drop default;
alter table public.sales alter column channel type text using channel::text;
alter table public.sales alter column channel set default 'local';
alter table public.sales
  add constraint sales_channel_fk foreign key (channel) references public.sale_channels (code)
  on update cascade on delete restrict;
drop type public.sale_channel;

-- -----------------------------------------------------------------------------
-- 3. Método de pago + register_sale
-- -----------------------------------------------------------------------------
alter table public.sales
  add column payment_method text not null default 'cash'
  check (payment_method in ('cash', 'card', 'transfer'));

-- p_payment_method: 'cash' (efectivo), 'card' (tarjeta) o 'transfer' (transferencia)
create function public.register_sale(
  p_channel            text,
  p_customer_name      text,
  p_note               text,
  p_items              jsonb,
  p_invoice_doc_type   public.invoice_type default 'ticket',
  p_invoice_doc_number text default null,
  p_customer_nrc       text default null,
  p_customer_nit       text default null,
  p_tax_details        jsonb default '{}'::jsonb,
  p_payment_method     text default 'cash'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_sale        uuid := gen_random_uuid();
  v_item        jsonb;
  v_extra       jsonb;
  v_extras_out  jsonb;
  v_prod        public.products%rowtype;
  v_qty         integer;
  v_price       numeric;
  v_unit        numeric;
  v_total       numeric := 0;
  v_extra_qty   numeric;
  v_extra_price numeric;
  v_extra_cost  numeric;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe incluir al menos un producto';
  end if;
  if jsonb_typeof(coalesce(p_tax_details, '{}'::jsonb)) <> 'object' then
    raise exception 'tax_details debe ser un objeto JSON';
  end if;

  if not exists (select 1 from public.sale_channels where code = coalesce(p_channel, 'local') and active) then
    raise exception 'Canal de venta no válido o inactivo';
  end if;
  if coalesce(p_payment_method, 'cash') not in ('cash', 'card', 'transfer') then
    raise exception 'Método de pago no válido';
  end if;

  insert into public.sales
    (id, channel, customer_name, note, invoice_doc_type, invoice_doc_number, customer_nrc, customer_nit, tax_details, payment_method)
  values
    (v_sale, coalesce(p_channel, 'local'), nullif(btrim(p_customer_name), ''), nullif(btrim(p_note), ''),
     coalesce(p_invoice_doc_type, 'ticket'), nullif(btrim(p_invoice_doc_number), ''),
     nullif(btrim(p_customer_nrc), ''), nullif(btrim(p_customer_nit), ''), coalesce(p_tax_details, '{}'::jsonb), coalesce(p_payment_method, 'cash'));

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida en la venta';
    end if;

    select * into v_prod from public.products
    where id = (v_item ->> 'product_id')::uuid and active for update;
    if not found then
      raise exception 'Producto inválido o inactivo';
    end if;

    v_price := coalesce((v_item ->> 'unit_price')::numeric, v_prod.sale_price);
    if v_price is null or v_price < 0 then
      raise exception 'El producto "%" no tiene precio: indícalo al vender', v_prod.name;
    end if;

    -- 1) Producto base
    if v_prod.fulfillment = 'made_to_stock' then
      if v_prod.current_stock < v_qty then
        raise exception 'Stock insuficiente de "%": disponible %, solicitado %', v_prod.name, v_prod.current_stock, v_qty
          using errcode = 'P0001';
      end if;
      v_unit := v_prod.avg_cost;
      insert into public.product_movements (product_id, type, quantity, unit_cost, ref_type, ref_id)
      values (v_prod.id, 'sale', -v_qty, v_unit, 'sale', v_sale);
    else
      v_unit := public._consume_recipe(v_prod.id, v_qty, 'sale', 'sale', v_sale, null) / v_qty;
    end if;

    -- 2) Extras (se multiplican por las unidades vendidas y suman a precio y costo)
    v_extras_out := '[]'::jsonb;
    if jsonb_typeof(coalesce(v_item -> 'extras', '[]'::jsonb)) <> 'array' then
      raise exception 'Los extras deben enviarse como lista';
    end if;

    for v_extra in select * from jsonb_array_elements(coalesce(v_item -> 'extras', '[]'::jsonb)) loop
      v_extra_qty   := (v_extra ->> 'quantity')::numeric;
      v_extra_price := coalesce((v_extra ->> 'extra_price')::numeric, 0);
      if v_extra_qty is null or v_extra_qty <= 0 or v_extra_price < 0 then
        raise exception 'Extra inválido: la cantidad debe ser mayor que cero y el precio no puede ser negativo';
      end if;

      v_extra_cost := public._consume_ingredient(
        (v_extra ->> 'ingredient_id')::uuid, round(v_extra_qty * v_qty, 3),
        'sale', 'sale', v_sale, 'Extra en venta', null
      );

      v_unit  := v_unit + v_extra_cost / v_qty;
      v_price := v_price + v_extra_price;
      v_extras_out := v_extras_out || jsonb_build_array(jsonb_build_object(
        'ingredient_id', v_extra ->> 'ingredient_id',
        'quantity',      v_extra_qty,
        'extra_price',   v_extra_price,
        'unit_cost',     round(v_extra_cost / v_qty, 6)
      ));
    end loop;

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost, extras)
    values (v_sale, v_prod.id, v_qty, round(v_price, 2), v_unit, v_extras_out);

    v_total := v_total + round(v_price, 2) * v_qty;
  end loop;

  update public.sales set total = v_total where id = v_sale;
  return v_sale;
end $$;

revoke all on function public.register_sale(text, text, text, jsonb, public.invoice_type, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.register_sale(text, text, text, jsonb, public.invoice_type, text, text, text, jsonb, text)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Corte de caja diario (Corte Z)
-- -----------------------------------------------------------------------------
create table public.cash_closings (
  id             uuid primary key default gen_random_uuid(),
  business_date  date not null unique,                       -- un solo corte por día
  opening_float  numeric(12,2) not null check (opening_float >= 0),
  cash_sales     numeric(12,2) not null check (cash_sales >= 0),
  card_sales     numeric(12,2) not null check (card_sales >= 0),
  transfer_sales numeric(12,2) not null check (transfer_sales >= 0),
  expected_cash  numeric(12,2) not null,                     -- fondo inicial + ventas en efectivo
  cash_counted   numeric(12,2) not null check (cash_counted >= 0),
  difference     numeric(12,2) not null,                     -- contado - esperado (negativo = faltante)
  note           text,
  closed_by      uuid not null default auth.uid() references auth.users (id),
  closed_at      timestamptz not null default now()
);
-- Un corte cerrado es un registro histórico: no se edita ni se borra
create trigger trg_cash_closings_immutable before update or delete on public.cash_closings
  for each row execute function public.prevent_mutation();

alter table public.cash_closings enable row level security;
create policy cash_closings_select on public.cash_closings for select to authenticated using (public.is_active_user());
grant select on public.cash_closings to authenticated;

-- Resumen en vivo del día (hora de El Salvador), sin cortes ni escritura
create function public.cash_day_summary(p_date date)
returns table (sales_count integer, cancelled_count integer, cash_sales numeric, card_sales numeric, transfer_sales numeric)
language sql stable security invoker set search_path = '' as $$
  select
    (count(*) filter (where s.status = 'completed'))::integer,
    (count(*) filter (where s.status <> 'completed'))::integer,
    coalesce(sum(s.total) filter (where s.status = 'completed' and s.payment_method = 'cash'), 0)::numeric,
    coalesce(sum(s.total) filter (where s.status = 'completed' and s.payment_method = 'card'), 0)::numeric,
    coalesce(sum(s.total) filter (where s.status = 'completed' and s.payment_method = 'transfer'), 0)::numeric
  from public.sales s
  where (s.sold_at at time zone 'America/El_Salvador')::date = p_date;
$$;

-- Los totales se recalculan en el servidor: el cliente solo aporta fondo inicial y efectivo contado
create function public.register_cash_closing(
  p_date          date,
  p_opening_float numeric,
  p_cash_counted  numeric,
  p_note          text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id       uuid := gen_random_uuid();
  v_cash     numeric;
  v_card     numeric;
  v_transfer numeric;
  v_expected numeric;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if p_date is null or p_date > (now() at time zone 'America/El_Salvador')::date then
    raise exception 'La fecha del corte no puede ser futura';
  end if;
  if p_opening_float is null or p_opening_float < 0 or p_cash_counted is null or p_cash_counted < 0 then
    raise exception 'El fondo inicial y el efectivo contado no pueden ser negativos';
  end if;

  select s.cash_sales, s.card_sales, s.transfer_sales
    into v_cash, v_card, v_transfer
  from public.cash_day_summary(p_date) s;

  v_expected := round(p_opening_float + v_cash, 2);

  insert into public.cash_closings
    (id, business_date, opening_float, cash_sales, card_sales, transfer_sales,
     expected_cash, cash_counted, difference, note)
  values
    (v_id, p_date, round(p_opening_float, 2), round(v_cash, 2), round(v_card, 2), round(v_transfer, 2),
     v_expected, round(p_cash_counted, 2), round(p_cash_counted, 2) - v_expected, nullif(btrim(p_note), ''));

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya existe un corte de caja para esa fecha';
end $$;

revoke all on function public.cash_day_summary(date), public.register_cash_closing(date, numeric, numeric, text)
  from public, anon, authenticated;
grant execute on function public.cash_day_summary(date), public.register_cash_closing(date, numeric, numeric, text)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Borrado de categorías (solo administrador; con ventas/productos asociados falla por la FK)
-- -----------------------------------------------------------------------------
create policy product_categories_delete on public.product_categories for delete to authenticated using (public.is_owner());
grant delete on public.product_categories to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Anti-negativos que faltaban
-- -----------------------------------------------------------------------------
alter table public.inventory_movements add constraint inventory_movements_unit_cost_nonneg check (unit_cost >= 0);
alter table public.product_movements   add constraint product_movements_unit_cost_nonneg   check (unit_cost >= 0);

-- -----------------------------------------------------------------------------
-- 7. Respaldo de permisos
-- El middleware ahora exige profiles.permissions. Los empleados que ya existían (con la lista
-- vacía de la migración 0004) conservan el acceso que tenían a los módulos operativos.
-- -----------------------------------------------------------------------------
update public.profiles
set permissions = array['ventas','caja','compras','insumos','productos','produccion','merma','proveedores']
where role = 'staff' and permissions = '{}';

commit;
