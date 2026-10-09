-- =============================================================================
-- Heart Desserts · Sistema de inventario
-- Migración 0001: esquema, seguridad (RLS), funciones transaccionales y vistas
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
create type public.user_role        as enum ('owner', 'staff');
create type public.base_unit        as enum ('g', 'ml', 'unit');
create type public.fulfillment_mode as enum ('made_to_stock', 'made_to_order');
create type public.movement_type    as enum ('purchase', 'production', 'sale', 'waste', 'adjustment', 'reversal');
create type public.sale_status      as enum ('completed', 'cancelled');
create type public.sale_channel     as enum ('local', 'whatsapp', 'instagram', 'other');
create type public.invoice_type     as enum ('ticket', 'fcf', 'ccf', 'export');

-- -----------------------------------------------------------------------------
-- 2. Utilidades
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create function public.prevent_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'La tabla % es un registro histórico: no se puede modificar ni borrar', tg_table_name
    using errcode = '42501';
end $$;

-- -----------------------------------------------------------------------------
-- 3. Usuarios y roles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text        not null default '',
  role       public.user_role not null default 'staff',
  active     boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger trg_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'owner');
$$;

-- -----------------------------------------------------------------------------
-- 4. Catálogos
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null check (length(btrim(name)) between 1 and 120),
  phone      text,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index suppliers_name_uq on public.suppliers (lower(name));
create trigger trg_suppliers_updated before update on public.suppliers
  for each row execute function public.set_updated_at();

create table public.ingredients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(btrim(name)) between 1 and 120),
  base_unit         public.base_unit not null,
  purchase_unit     text not null default 'unidad',
  conversion_factor numeric(14,6) not null default 1 check (conversion_factor > 0),
  current_stock     numeric(14,3) not null default 0 check (current_stock >= 0),
  min_stock         numeric(14,3) not null default 0 check (min_stock >= 0),
  avg_cost          numeric(14,6) not null default 0 check (avg_cost >= 0),
  is_perishable     boolean not null default false,
  active            boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index ingredients_name_uq on public.ingredients (lower(name));
create trigger trg_ingredients_updated before update on public.ingredients
  for each row execute function public.set_updated_at();

create table public.product_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index product_categories_name_uq on public.product_categories (lower(name));
create trigger trg_product_categories_updated before update on public.product_categories
  for each row execute function public.set_updated_at();

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.product_categories (id) on delete restrict,
  name          text not null check (length(btrim(name)) between 1 and 120),
  description   text,
  sale_price    numeric(10,2) check (sale_price >= 0),
  fulfillment   public.fulfillment_mode not null default 'made_to_order',
  current_stock integer not null default 0 check (current_stock >= 0),
  min_stock     integer not null default 0 check (min_stock >= 0),
  avg_cost      numeric(14,6) not null default 0 check (avg_cost >= 0),
  image_path    text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index products_name_uq on public.products (lower(name));
create index products_category_idx on public.products (category_id);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.recipes (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null unique references public.products (id) on delete cascade,
  yield_portions integer not null check (yield_portions > 0),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_recipes_updated before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_items (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity      numeric(14,3) not null check (quantity > 0),
  waste_pct     numeric(5,2)  not null default 0 check (waste_pct >= 0 and waste_pct <= 100),
  unique (recipe_id, ingredient_id)
);
create index recipe_items_ingredient_idx on public.recipe_items (ingredient_id);

-- -----------------------------------------------------------------------------
-- 5. Operaciones
-- -----------------------------------------------------------------------------
create table public.purchases (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    uuid references public.suppliers (id) on delete restrict,
  purchased_on   date not null default current_date,
  invoice_number text,
  total          numeric(12,2) not null default 0 check (total >= 0),
  note           text,
  created_by     uuid not null default auth.uid() references auth.users (id),
  created_at     timestamptz not null default now()
);
create index purchases_date_idx on public.purchases (purchased_on desc);

create table public.purchase_items (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references public.purchases (id) on delete restrict,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity      numeric(14,3) not null check (quantity > 0),
  total_cost    numeric(12,4) not null check (total_cost >= 0),
  expires_on    date
);
create index purchase_items_purchase_idx on public.purchase_items (purchase_id);

create table public.ingredient_lots (
  id               uuid primary key default gen_random_uuid(),
  ingredient_id    uuid not null references public.ingredients (id) on delete restrict,
  purchase_item_id uuid references public.purchase_items (id) on delete restrict,
  received_on      date not null default current_date,
  expires_on       date,
  qty_initial      numeric(14,3) not null check (qty_initial > 0),
  qty_remaining    numeric(14,3) not null check (qty_remaining >= 0),
  unit_cost        numeric(14,6) not null check (unit_cost >= 0),
  created_at       timestamptz not null default now(),
  check (qty_remaining <= qty_initial)
);
create index ingredient_lots_fefo_idx
  on public.ingredient_lots (ingredient_id, expires_on nulls last, received_on)
  where qty_remaining > 0;

create table public.inventory_movements (
  id            bigint generated always as identity primary key,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  lot_id        uuid references public.ingredient_lots (id) on delete restrict,
  type          public.movement_type not null,
  quantity      numeric(14,3) not null check (quantity <> 0),
  unit_cost     numeric(14,6) not null default 0,
  ref_type      text,
  ref_id        uuid,
  reason        text,
  note          text,
  created_by    uuid not null default auth.uid() references auth.users (id),
  created_at    timestamptz not null default now()
);
create index inventory_movements_ing_idx on public.inventory_movements (ingredient_id, created_at desc);
create index inventory_movements_ref_idx on public.inventory_movements (ref_type, ref_id);

create table public.production_batches (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete restrict,
  recipe_id   uuid not null references public.recipes (id) on delete restrict,
  portions    integer not null check (portions > 0),
  total_cost  numeric(14,4) not null check (total_cost >= 0),
  unit_cost   numeric(14,6) not null check (unit_cost >= 0),
  produced_at timestamptz not null default now(),
  note        text,
  created_by  uuid not null default auth.uid() references auth.users (id)
);
create index production_batches_product_idx on public.production_batches (product_id, produced_at desc);

create table public.product_movements (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete restrict,
  type       public.movement_type not null,
  quantity   integer not null check (quantity <> 0),
  unit_cost  numeric(14,6) not null default 0,
  ref_type   text,
  ref_id     uuid,
  note       text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index product_movements_prod_idx on public.product_movements (product_id, created_at desc);
create index product_movements_ref_idx  on public.product_movements (ref_type, ref_id);

create table public.sales (
  id                 uuid primary key default gen_random_uuid(),
  sold_at            timestamptz not null default now(),
  channel            public.sale_channel not null default 'local',
  customer_name      text,
  invoice_doc_type   public.invoice_type not null default 'ticket',
  invoice_doc_number text,
  customer_nrc       text,
  customer_nit       text,
  status             public.sale_status not null default 'completed',
  total              numeric(12,2) not null default 0 check (total >= 0),
  note               text,
  created_by         uuid not null default auth.uid() references auth.users (id),
  cancelled_at       timestamptz,
  cancelled_by       uuid references auth.users (id),
  cancel_reason      text
);
create index sales_sold_at_idx on public.sales (sold_at desc);

create table public.sale_items (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity   integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  unit_cost  numeric(14,6) not null default 0 check (unit_cost >= 0),
  extras     jsonb not null default '[]'::jsonb
);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_product_idx on public.sale_items (product_id);

-- -----------------------------------------------------------------------------
-- 6. Triggers de integridad
-- -----------------------------------------------------------------------------
create function public.apply_ingredient_movement()
returns trigger language plpgsql as $$
begin
  update public.ingredients set current_stock = current_stock + new.quantity where id = new.ingredient_id;
  return new;
end $$;

create trigger trg_inventory_movements_apply after insert on public.inventory_movements
  for each row execute function public.apply_ingredient_movement();

create function public.apply_product_movement()
returns trigger language plpgsql as $$
begin
  update public.products set current_stock = current_stock + new.quantity where id = new.product_id;
  return new;
end $$;

create trigger trg_product_movements_apply after insert on public.product_movements
  for each row execute function public.apply_product_movement();

create trigger trg_inventory_movements_immutable before update or delete on public.inventory_movements
  for each row execute function public.prevent_mutation();
create trigger trg_product_movements_immutable before update or delete on public.product_movements
  for each row execute function public.prevent_mutation();
create trigger trg_production_batches_immutable before update or delete on public.production_batches
  for each row execute function public.prevent_mutation();
create trigger trg_purchase_items_immutable before update or delete on public.purchase_items
  for each row execute function public.prevent_mutation();
create trigger trg_sale_items_immutable before update or delete on public.sale_items
  for each row execute function public.prevent_mutation();

-- -----------------------------------------------------------------------------
-- 7. Funciones internas (no expuestas al cliente)
-- -----------------------------------------------------------------------------
create function public._consume_ingredient(
  p_ingredient uuid,
  p_qty        numeric,
  p_type       public.movement_type,
  p_ref_type   text,
  p_ref_id     uuid,
  p_reason     text,
  p_note       text
) returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  v_stock numeric;
  v_name  text;
  v_left  numeric := p_qty;
  v_cost  numeric := 0;
  v_take  numeric;
  v_lot   record;
begin
  select current_stock, name into v_stock, v_name
  from public.ingredients where id = p_ingredient for update;

  if not found then
    raise exception 'El insumo no existe';
  end if;
  if v_stock < p_qty then
    raise exception 'Stock insuficiente de "%": disponible %, requerido %', v_name, v_stock, p_qty
      using errcode = 'P0001';
  end if;

  for v_lot in
    select id, qty_remaining, unit_cost
    from public.ingredient_lots
    where ingredient_id = p_ingredient and qty_remaining > 0
    order by expires_on nulls last, received_on, created_at
    for update
  loop
    exit when v_left <= 0;
    v_take := least(v_lot.qty_remaining, v_left);

    update public.ingredient_lots set qty_remaining = qty_remaining - v_take where id = v_lot.id;

    insert into public.inventory_movements
      (ingredient_id, lot_id, type, quantity, unit_cost, ref_type, ref_id, reason, note)
    values
      (p_ingredient, v_lot.id, p_type, -v_take, v_lot.unit_cost, p_ref_type, p_ref_id, p_reason, p_note);

    v_cost := v_cost + v_take * v_lot.unit_cost;
    v_left := v_left - v_take;
  end loop;

  if v_left > 0 then
    raise exception 'Inconsistencia de lotes en "%": contacta a soporte', v_name;
  end if;
  return v_cost;
end $$;

create function public._consume_recipe(
  p_product_id uuid,
  p_portions   integer,
  p_type       public.movement_type,
  p_ref_type   text,
  p_ref_id     uuid,
  p_note       text
) returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  v_recipe public.recipes%rowtype;
  v_item   record;
  v_qty    numeric;
  v_cost   numeric := 0;
  v_count  integer := 0;
begin
  select * into v_recipe from public.recipes where product_id = p_product_id;
  if not found then
    raise exception 'El producto no tiene receta registrada';
  end if;

  for v_item in
    select ingredient_id, quantity, waste_pct
    from public.recipe_items where recipe_id = v_recipe.id
    order by ingredient_id
  loop
    v_count := v_count + 1;
    v_qty := round(v_item.quantity * p_portions / v_recipe.yield_portions * (1 + v_item.waste_pct / 100), 3);
    if v_qty > 0 then
      v_cost := v_cost + public._consume_ingredient(v_item.ingredient_id, v_qty, p_type, p_ref_type, p_ref_id, null, p_note);
    end if;
  end loop;

  if v_count = 0 then
    raise exception 'La receta no tiene ingredientes';
  end if;
  return v_cost;
end $$;

-- -----------------------------------------------------------------------------
-- 8. Funciones públicas (RPC) · transaccionales
-- -----------------------------------------------------------------------------
create function public.receive_purchase(
  p_supplier_id  uuid,
  p_purchased_on date,
  p_invoice      text,
  p_note         text,
  p_items        jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid;
  v_item  jsonb;
  v_ing   public.ingredients%rowtype;
  v_qty   numeric;
  v_total numeric;
  v_unit  numeric;
  v_exp   date;
  v_pi    uuid;
  v_lot   uuid;
  v_sum   numeric := 0;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra debe incluir al menos un artículo';
  end if;

  insert into public.purchases (supplier_id, purchased_on, invoice_number, note)
  values (p_supplier_id, coalesce(p_purchased_on, current_date), nullif(btrim(p_invoice), ''), nullif(btrim(p_note), ''))
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_ing from public.ingredients
    where id = (v_item ->> 'ingredient_id')::uuid and active for update;
    if not found then
      raise exception 'Insumo inválido o inactivo';
    end if;

    v_qty   := ((v_item ->> 'quantity')::numeric) * v_ing.conversion_factor;
    v_total := (v_item ->> 'total_cost')::numeric;
    v_exp   := nullif(v_item ->> 'expires_on', '')::date;

    if v_qty is null or v_qty <= 0 or v_total is null or v_total < 0 then
      raise exception 'Cantidad o costo inválido en la compra';
    end if;

    v_unit := v_total / v_qty;

    insert into public.purchase_items (purchase_id, ingredient_id, quantity, total_cost, expires_on)
    values (v_id, v_ing.id, v_qty, v_total, v_exp)
    returning id into v_pi;

    insert into public.ingredient_lots
      (ingredient_id, purchase_item_id, received_on, expires_on, qty_initial, qty_remaining, unit_cost)
    values
      (v_ing.id, v_pi, coalesce(p_purchased_on, current_date), v_exp, v_qty, v_qty, v_unit)
    returning id into v_lot;

    update public.ingredients
    set avg_cost = case when current_stock + v_qty = 0 then v_unit
                        else (current_stock * avg_cost + v_total) / (current_stock + v_qty) end
    where id = v_ing.id;

    insert into public.inventory_movements
      (ingredient_id, lot_id, type, quantity, unit_cost, ref_type, ref_id, note)
    values
      (v_ing.id, v_lot, 'purchase', v_qty, v_unit, 'purchase', v_id, nullif(btrim(p_note), ''));

    v_sum := v_sum + v_total;
  end loop;

  update public.purchases set total = round(v_sum, 2) where id = v_id;
  return v_id;
end $$;

create function public.adjust_ingredient(
  p_ingredient_id uuid,
  p_delta         numeric,
  p_type          public.movement_type,
  p_reason        text,
  p_note          text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ing public.ingredients%rowtype;
  v_lot uuid;
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
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'Indica el motivo del movimiento';
  end if;
  if p_type = 'waste' and p_delta > 0 then
    raise exception 'Una merma debe ser una cantidad negativa';
  end if;

  select * into v_ing from public.ingredients where id = p_ingredient_id for update;
  if not found then
    raise exception 'El insumo no existe';
  end if;

  if p_delta < 0 then
    perform public._consume_ingredient(p_ingredient_id, abs(p_delta), p_type, 'adjustment', null, btrim(p_reason), p_note);
  else
    insert into public.ingredient_lots (ingredient_id, qty_initial, qty_remaining, unit_cost)
    values (p_ingredient_id, p_delta, p_delta, v_ing.avg_cost)
    returning id into v_lot;

    insert into public.inventory_movements (ingredient_id, lot_id, type, quantity, unit_cost, ref_type, reason, note)
    values (p_ingredient_id, v_lot, 'adjustment', p_delta, v_ing.avg_cost, 'adjustment', btrim(p_reason), p_note);
  end if;
end $$;

create function public.register_production(
  p_product_id uuid,
  p_portions   integer,
  p_note       text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_prod  public.products%rowtype;
  v_batch uuid := gen_random_uuid();
  v_cost  numeric;
  v_unit  numeric;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if p_portions is null or p_portions <= 0 then
    raise exception 'Las porciones deben ser un número mayor que cero';
  end if;

  select * into v_prod from public.products where id = p_product_id and active for update;
  if not found then
    raise exception 'Producto inválido o inactivo';
  end if;
  if v_prod.fulfillment <> 'made_to_stock' then
    raise exception 'Este producto se elabora por encargo: sus insumos se descuentan al registrar la venta';
  end if;

  v_cost := public._consume_recipe(p_product_id, p_portions, 'production', 'production', v_batch, p_note);
  v_unit := v_cost / p_portions;

  insert into public.production_batches (id, product_id, recipe_id, portions, total_cost, unit_cost, note)
  select v_batch, p_product_id, r.id, p_portions, round(v_cost, 4), v_unit, nullif(btrim(p_note), '')
  from public.recipes r where r.product_id = p_product_id;

  update public.products
  set avg_cost = case when current_stock + p_portions = 0 then v_unit
                      else (current_stock * avg_cost + v_cost) / (current_stock + p_portions) end
  where id = p_product_id;

  insert into public.product_movements (product_id, type, quantity, unit_cost, ref_type, ref_id, note)
  values (p_product_id, 'production', p_portions, v_unit, 'production', v_batch, nullif(btrim(p_note), ''));

  return v_batch;
end $$;

create function public.register_sale(
  p_channel       public.sale_channel,
  p_customer_name text,
  p_note          text,
  p_items         jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_sale  uuid := gen_random_uuid();
  v_item  jsonb;
  v_prod  public.products%rowtype;
  v_qty   integer;
  v_price numeric;
  v_unit  numeric;
  v_total numeric := 0;
  v_extra_item jsonb;
  v_extra_qty numeric;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe incluir al menos un producto';
  end if;

  insert into public.sales (id, channel, customer_name, note)
  values (v_sale, coalesce(p_channel, 'local'), nullif(btrim(p_customer_name), ''), nullif(btrim(p_note), ''));

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

    if jsonb_array_length(coalesce(v_item -> 'extras', '[]'::jsonb)) > 0 then
      for v_extra_item in select * from jsonb_array_elements(v_item -> 'extras') loop
        v_extra_qty := (v_extra_item ->> 'quantity')::numeric;
        perform public._consume_ingredient((v_extra_item ->> 'ingredient_id')::uuid, v_extra_qty, 'sale', 'sale', v_sale, 'Extra en venta', null);
        v_price := v_price + coalesce((v_extra_item ->> 'extra_price')::numeric, 0);
      end loop;
    end if;

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

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost, extras)
    values (v_sale, v_prod.id, v_qty, round(v_price, 2), v_unit, coalesce(v_item -> 'extras', '[]'::jsonb));

    v_total := v_total + round(v_price, 2) * v_qty;
  end loop;

  update public.sales set total = v_total where id = v_sale;
  return v_sale;
end $$;

create function public.cancel_sale(p_sale_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_sale public.sales%rowtype;
  v_mov  record;
begin
  if not public.is_owner() then
    raise exception 'Solo la dueña puede anular ventas' using errcode = '42501';
  end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'Indica el motivo de la anulación';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'La venta no existe';
  end if;
  if v_sale.status = 'cancelled' then
    raise exception 'La venta ya fue anulada';
  end if;

  for v_mov in
    select ingredient_id, lot_id, quantity, unit_cost
    from public.inventory_movements
    where ref_type = 'sale' and ref_id = p_sale_id and type = 'sale'
    order by ingredient_id
  loop
    update public.ingredient_lots set qty_remaining = qty_remaining - v_mov.quantity where id = v_mov.lot_id;
    insert into public.inventory_movements (ingredient_id, lot_id, type, quantity, unit_cost, ref_type, ref_id, reason)
    values (v_mov.ingredient_id, v_mov.lot_id, 'reversal', -v_mov.quantity, v_mov.unit_cost, 'sale_cancel', p_sale_id, btrim(p_reason));
  end loop;

  for v_mov in
    select product_id, quantity, unit_cost
    from public.product_movements
    where ref_type = 'sale' and ref_id = p_sale_id and type = 'sale'
  loop
    insert into public.product_movements (product_id, type, quantity, unit_cost, ref_type, ref_id, note)
    values (v_mov.product_id, 'reversal', -v_mov.quantity, v_mov.unit_cost, 'sale_cancel', p_sale_id, btrim(p_reason));
  end loop;

  update public.sales
  set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = btrim(p_reason)
  where id = p_sale_id;
end $$;

-- -----------------------------------------------------------------------------
-- 9. Vistas de lectura
-- -----------------------------------------------------------------------------
create view public.v_ingredient_status with (security_invoker = true) as
select
  i.id, i.name, i.base_unit, i.purchase_unit, i.conversion_factor, i.current_stock, i.min_stock, i.avg_cost,
  (i.current_stock <= i.min_stock) as is_low,
  (select min(l.expires_on) from public.ingredient_lots l
    where l.ingredient_id = i.id and l.qty_remaining > 0) as next_expiry
from public.ingredients i
where i.active;

create view public.v_expiring_lots with (security_invoker = true) as
select l.id as lot_id, i.id as ingredient_id, i.name, i.base_unit,
       l.qty_remaining, l.expires_on, (l.expires_on - current_date) as days_left
from public.ingredient_lots l
join public.ingredients i on i.id = l.ingredient_id
where l.qty_remaining > 0
  and l.expires_on is not null
  and l.expires_on <= current_date + 3
order by l.expires_on;

create view public.v_product_costing with (security_invoker = true) as
select c.*,
  case when c.sale_price > 0 and c.unit_cost is not null
       then round((c.sale_price - c.unit_cost) / c.sale_price * 100, 1) end as margin_pct
from (
  select
    p.id as product_id, p.name, p.sale_price,
    round(sum(ri.quantity * (1 + ri.waste_pct / 100) * ing.avg_cost) / r.yield_portions, 4) as unit_cost
  from public.products p
  join public.recipes r        on r.product_id = p.id
  join public.recipe_items ri  on ri.recipe_id = r.id
  join public.ingredients ing  on ing.id = ri.ingredient_id
  where p.active
  group by p.id, p.name, p.sale_price, r.yield_portions
) c;

-- -----------------------------------------------------------------------------
-- 10. Seguridad: RLS + privilegios mínimos
-- -----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.suppliers           enable row level security;
alter table public.ingredients         enable row level security;
alter table public.product_categories  enable row level security;
alter table public.products            enable row level security;
alter table public.recipes             enable row level security;
alter table public.recipe_items        enable row level security;
alter table public.purchases           enable row level security;
alter table public.purchase_items      enable row level security;
alter table public.ingredient_lots     enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.production_batches  enable row level security;
alter table public.product_movements   enable row level security;
alter table public.sales               enable row level security;
alter table public.sale_items          enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','ingredients','product_categories','products','recipes','recipe_items',
    'purchases','purchase_items','ingredient_lots','inventory_movements',
    'production_batches','product_movements','sales','sale_items'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_active_user())',
                   t || '_select', t);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_owner());
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

do $$
declare t text;
begin
  foreach t in array array['suppliers','ingredients','product_categories','products','recipes','recipe_items'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_owner())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_owner()) with check (public.is_owner())', t || '_update', t);
  end loop;
end $$;
create policy recipe_items_delete on public.recipe_items for delete to authenticated using (public.is_owner());

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on
  public.profiles, public.suppliers, public.ingredients, public.product_categories, public.products,
  public.recipes, public.recipe_items, public.purchases, public.purchase_items, public.ingredient_lots,
  public.inventory_movements, public.production_batches, public.product_movements, public.sales,
  public.sale_items, public.v_ingredient_status, public.v_expiring_lots, public.v_product_costing
to authenticated;

grant update (full_name, role, active)                                   on public.profiles           to authenticated;
grant insert (name, phone, notes)                                        on public.suppliers          to authenticated;
grant update (name, phone, notes, active)                                on public.suppliers          to authenticated;
grant insert (name, base_unit, purchase_unit, conversion_factor, min_stock, is_perishable, notes)          on public.ingredients        to authenticated;
grant update (name, purchase_unit, conversion_factor, min_stock, is_perishable, notes, active)             on public.ingredients        to authenticated;
grant insert (name, sort_order)                                          on public.product_categories to authenticated;
grant update (name, sort_order, active)                                  on public.product_categories to authenticated;
grant insert (category_id, name, description, sale_price, fulfillment, min_stock, image_path)
                                                                         on public.products          to authenticated;
grant update (category_id, name, description, sale_price, min_stock, image_path, active)
                                                                         on public.products          to authenticated;
grant insert (product_id, yield_portions, notes)                         on public.recipes            to authenticated;
grant update (yield_portions, notes)                                     on public.recipes            to authenticated;
grant insert (recipe_id, ingredient_id, quantity, waste_pct)             on public.recipe_items       to authenticated;
grant update (quantity, waste_pct)                                       on public.recipe_items       to authenticated;
grant delete                                                             on public.recipe_items       to authenticated;

grant execute on function public.is_active_user(), public.is_owner() to authenticated;
grant execute on function
  public.receive_purchase(uuid, date, text, text, jsonb),
  public.adjust_ingredient(uuid, numeric, public.movement_type, text, text),
  public.register_production(uuid, integer, text),
  public.register_sale(public.sale_channel, text, text, jsonb),
  public.cancel_sale(uuid, text)
to authenticated;

-- -----------------------------------------------------------------------------
-- 11. Datos iniciales
-- -----------------------------------------------------------------------------
insert into public.product_categories (name, sort_order) values
  ('Postres', 1), ('Cheesecakes', 2), ('Croissants', 3), ('Crepas', 4),
  ('Bebidas frías', 5), ('Bebidas calientes', 6), ('Especiales', 7),
  ('Pasteles personalizados', 8), ('Desayunos', 9);

commit;