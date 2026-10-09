-- =============================================================================
-- Heart Desserts · Migración 0002
--   1. Mermas estructuradas (wastage_logs + motivo)
--   2. register_sale: extras corregidos (cantidad x unidades, validación, costo
--      real) + datos de facturación (documento, NRC, NIT, tax_details)
-- Esta migración NO modifica la 0001: la reemplaza donde hace falta.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Mermas estructuradas
-- -----------------------------------------------------------------------------
create type public.waste_reason as enum ('expired', 'prep_error', 'dropped', 'spoiled', 'other');

create table public.wastage_logs (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity      numeric(14,3) not null check (quantity > 0),
  cost_lost     numeric(14,4) not null default 0 check (cost_lost >= 0),
  reason_code   public.waste_reason not null,
  note          text,
  created_by    uuid not null default auth.uid() references auth.users (id),
  created_at    timestamptz not null default now()
);
create index wastage_logs_ingredient_idx on public.wastage_logs (ingredient_id, created_at desc);

create trigger trg_wastage_logs_immutable before update or delete on public.wastage_logs
  for each row execute function public.prevent_mutation();

alter table public.wastage_logs enable row level security;
create policy wastage_logs_select on public.wastage_logs
  for select to authenticated using (public.is_active_user());

-- Supabase concede privilegios por defecto a tablas nuevas: se quitan y se da solo lectura
revoke all on public.wastage_logs from anon, authenticated;
grant select on public.wastage_logs to authenticated;

drop function public.adjust_ingredient(uuid, numeric, public.movement_type, text, text);

create function public.adjust_ingredient(
  p_ingredient_id uuid,
  p_delta         numeric,
  p_type          public.movement_type,
  p_reason        text default null,
  p_note          text default null,
  p_reason_code   public.waste_reason default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ing    public.ingredients%rowtype;
  v_lot    uuid;
  v_cost   numeric;
  v_reason text;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if p_type not in ('waste', 'adjustment') then
    raise exception 'Tipo de movimiento no permitido';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'La cantidad no puede ser cero';
  end if;
  if p_type = 'waste' and p_delta > 0 then
    raise exception 'Una merma debe ser una cantidad negativa';
  end if;
  if p_type = 'waste' and p_reason_code is null then
    raise exception 'Selecciona el motivo de la merma';
  end if;

  v_reason := coalesce(nullif(btrim(p_reason), ''), p_reason_code::text);
  if v_reason is null then
    raise exception 'Indica el motivo del movimiento';
  end if;

  select * into v_ing from public.ingredients where id = p_ingredient_id for update;
  if not found then
    raise exception 'El insumo no existe';
  end if;

  if p_delta < 0 then
    v_cost := public._consume_ingredient(p_ingredient_id, abs(p_delta), p_type, 'adjustment', null, v_reason, p_note);

    if p_type = 'waste' then
      insert into public.wastage_logs (ingredient_id, quantity, cost_lost, reason_code, note)
      values (p_ingredient_id, abs(p_delta), round(v_cost, 4), p_reason_code, nullif(btrim(p_note), ''));
    end if;
  else
    insert into public.ingredient_lots (ingredient_id, qty_initial, qty_remaining, unit_cost)
    values (p_ingredient_id, p_delta, p_delta, v_ing.avg_cost)
    returning id into v_lot;

    insert into public.inventory_movements (ingredient_id, lot_id, type, quantity, unit_cost, ref_type, reason, note)
    values (p_ingredient_id, v_lot, 'adjustment', p_delta, v_ing.avg_cost, 'adjustment', v_reason, p_note);
  end if;
end $$;

revoke all on function public.adjust_ingredient(uuid, numeric, public.movement_type, text, text, public.waste_reason)
  from public, anon, authenticated;
grant execute on function public.adjust_ingredient(uuid, numeric, public.movement_type, text, text, public.waste_reason)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Ventas: facturación y extras
-- -----------------------------------------------------------------------------
alter table public.sales
  add column tax_details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(tax_details) = 'object');

-- Un mismo número de documento no puede repetirse por tipo (aunque la venta se anule)
create unique index sales_invoice_doc_uq
  on public.sales (invoice_doc_type, invoice_doc_number)
  where invoice_doc_number is not null;

drop function public.register_sale(public.sale_channel, text, text, jsonb);

-- p_items: [{product_id, quantity, unit_price?, extras?: [{ingredient_id, quantity, extra_price?}]}]
-- En extras, "quantity" es POR UNIDAD vendida (2 crepas con extra de 15 g = 30 g descontados).
create function public.register_sale(
  p_channel            public.sale_channel,
  p_customer_name      text,
  p_note               text,
  p_items              jsonb,
  p_invoice_doc_type   public.invoice_type default 'ticket',
  p_invoice_doc_number text default null,
  p_customer_nrc       text default null,
  p_customer_nit       text default null,
  p_tax_details        jsonb default '{}'::jsonb
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

  insert into public.sales
    (id, channel, customer_name, note, invoice_doc_type, invoice_doc_number, customer_nrc, customer_nit, tax_details)
  values
    (v_sale, coalesce(p_channel, 'local'), nullif(btrim(p_customer_name), ''), nullif(btrim(p_note), ''),
     coalesce(p_invoice_doc_type, 'ticket'), nullif(btrim(p_invoice_doc_number), ''),
     nullif(btrim(p_customer_nrc), ''), nullif(btrim(p_customer_nit), ''), coalesce(p_tax_details, '{}'::jsonb));

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

revoke all on function public.register_sale(public.sale_channel, text, text, jsonb, public.invoice_type, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.register_sale(public.sale_channel, text, text, jsonb, public.invoice_type, text, text, text, jsonb)
  to authenticated;

commit;
