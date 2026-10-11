-- =============================================================================
-- Heart Desserts · Migración 0006
--   1. Día cerrado = día bloqueado: no se registran ni se anulan ventas de un día
--      con corte de caja. Solo la administradora puede reabrirlo (queda historial).
--   2. apply_physical_count: ajusta el stock al conteo real, todo o nada.
-- Requiere las migraciones 0001 a 0005.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Historial de reaperturas (inmutable)
-- -----------------------------------------------------------------------------
create table public.cash_closing_history (
  id             uuid primary key default gen_random_uuid(),
  closing_id     uuid not null,
  business_date  date not null,
  opening_float  numeric(12,2) not null,
  cash_sales     numeric(12,2) not null,
  card_sales     numeric(12,2) not null,
  transfer_sales numeric(12,2) not null,
  expected_cash  numeric(12,2) not null,
  cash_counted   numeric(12,2) not null,
  difference     numeric(12,2) not null,
  note           text,
  closed_by      uuid,
  closed_at      timestamptz not null,
  reopened_by    uuid not null default auth.uid() references auth.users (id),
  reopened_at    timestamptz not null default now(),
  reopen_reason  text not null check (length(btrim(reopen_reason)) between 3 and 200)
);
create index cash_closing_history_date_idx on public.cash_closing_history (business_date desc);

create trigger trg_cash_closing_history_immutable before update or delete on public.cash_closing_history
  for each row execute function public.prevent_mutation();

alter table public.cash_closing_history enable row level security;
create policy cash_closing_history_select on public.cash_closing_history
  for select to authenticated using (public.is_active_user());
revoke all on public.cash_closing_history from anon, authenticated;
grant select on public.cash_closing_history to authenticated;

-- -----------------------------------------------------------------------------
-- 2. El corte sigue siendo inmutable; solo reopen_cash_day puede retirarlo
-- -----------------------------------------------------------------------------
create function public.guard_cash_closings()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and current_setting('app.reopening_cash_day', true) = 'on' then
    return old;
  end if;
  raise exception 'Un corte de caja cerrado no se puede modificar ni borrar. La administradora puede reabrir el día.';
end $$;

drop trigger trg_cash_closings_immutable on public.cash_closings;
create trigger trg_cash_closings_guard before update or delete on public.cash_closings
  for each row execute function public.guard_cash_closings();

-- -----------------------------------------------------------------------------
-- 3. Día cerrado: consulta y bloqueo
-- -----------------------------------------------------------------------------
create function public.is_day_closed(p_date date)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cash_closings where business_date = p_date);
$$;

create function public.guard_closed_day()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_date date;
begin
  if tg_op = 'INSERT' then
    v_date := (new.sold_at at time zone 'America/El_Salvador')::date;
    if public.is_day_closed(v_date) then
      raise exception 'La caja de hoy ya está cerrada. Pide a la administradora que la reabra para registrar más ventas.';
    end if;
    return new;
  end if;

  -- UPDATE: solo se bloquea anular una venta que pertenece a un día cerrado
  if old.status = 'completed' and new.status <> 'completed' then
    v_date := (old.sold_at at time zone 'America/El_Salvador')::date;
    if public.is_day_closed(v_date) then
      raise exception 'La caja del % ya está cerrada: no se pueden anular sus ventas. La administradora puede reabrir el día.',
        to_char(v_date, 'DD/MM/YYYY');
    end if;
  end if;
  return new;
end $$;

create trigger trg_sales_closed_day before insert or update on public.sales
  for each row execute function public.guard_closed_day();

-- -----------------------------------------------------------------------------
-- 4. Reabrir un día (solo administradora, con motivo; el corte anterior queda en el historial)
-- -----------------------------------------------------------------------------
create function public.reopen_cash_day(p_date date, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v public.cash_closings%rowtype;
begin
  if not public.is_owner() then
    raise exception 'Solo la administradora puede reabrir un día' using errcode = '42501';
  end if;
  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'Escribe el motivo de la reapertura (mínimo 3 caracteres)';
  end if;

  select * into v from public.cash_closings where business_date = p_date for update;
  if not found then
    raise exception 'Ese día no tiene un corte de caja cerrado';
  end if;

  insert into public.cash_closing_history
    (closing_id, business_date, opening_float, cash_sales, card_sales, transfer_sales,
     expected_cash, cash_counted, difference, note, closed_by, closed_at, reopen_reason)
  values
    (v.id, v.business_date, v.opening_float, v.cash_sales, v.card_sales, v.transfer_sales,
     v.expected_cash, v.cash_counted, v.difference, v.note, v.closed_by, v.closed_at, btrim(p_reason));

  perform set_config('app.reopening_cash_day', 'on', true);
  delete from public.cash_closings where id = v.id;
  perform set_config('app.reopening_cash_day', 'off', true);
end $$;

-- -----------------------------------------------------------------------------
-- 5. Inventario físico: ajusta cada insumo al conteo real (todo o nada)
--    p_items: [{ingredient_id, counted}]  (counted en unidad base)
-- -----------------------------------------------------------------------------
create function public.apply_physical_count(p_items jsonb, p_note text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_item    jsonb;
  v_ing     uuid;
  v_counted numeric;
  v_stock   numeric;
  v_delta   numeric;
  v_changed integer := 0;
  v_reason  text;
begin
  if not public.is_active_user() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'No hay conteos para aplicar';
  end if;

  v_reason := 'Conteo físico' || coalesce(' · ' || nullif(btrim(p_note), ''), '');

  -- orden fijo para evitar bloqueos entre operaciones simultáneas
  for v_item in select e from jsonb_array_elements(p_items) e order by e ->> 'ingredient_id' loop
    v_ing     := (v_item ->> 'ingredient_id')::uuid;
    v_counted := (v_item ->> 'counted')::numeric;

    if v_ing is null or v_counted is null or v_counted < 0 then
      raise exception 'El conteo de cada insumo debe ser un número igual o mayor que cero';
    end if;

    select current_stock into v_stock from public.ingredients where id = v_ing and active for update;
    if not found then
      raise exception 'Hay un insumo inválido o inactivo en el conteo';
    end if;

    v_delta := round(v_counted - v_stock, 3);
    if v_delta <> 0 then
      perform public.adjust_ingredient(v_ing, v_delta, 'adjustment'::public.movement_type, v_reason, null::text);
      v_changed := v_changed + 1;
    end if;
  end loop;

  return v_changed;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Permisos
-- -----------------------------------------------------------------------------
revoke all on function
  public.is_day_closed(date),
  public.reopen_cash_day(date, text),
  public.apply_physical_count(jsonb, text),
  public.guard_closed_day(),
  public.guard_cash_closings()
  from public, anon, authenticated;

grant execute on function
  public.is_day_closed(date),
  public.reopen_cash_day(date, text),
  public.apply_physical_count(jsonb, text)
  to authenticated;

commit;
