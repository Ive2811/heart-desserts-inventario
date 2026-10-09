-- =============================================================================
-- Heart Desserts · Migración 0003
-- save_recipe: guarda la receta de un producto de forma atómica (todo o nada).
-- Solo la dueña puede ejecutarla.
-- =============================================================================

begin;

create function public.save_recipe(
  p_product_id     uuid,
  p_yield_portions integer,
  p_notes          text,
  p_items          jsonb  -- [{ingredient_id, quantity, waste_pct?}]  (quantity en unidad base)
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_recipe uuid;
  v_item   jsonb;
  v_ing    uuid;
  v_qty    numeric;
  v_waste  numeric;
  v_seen   uuid[] := '{}';
begin
  if not public.is_owner() then
    raise exception 'Solo la dueña puede editar recetas' using errcode = '42501';
  end if;
  if p_yield_portions is null or p_yield_portions <= 0 then
    raise exception 'La receta debe rendir al menos 1 porción';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La receta necesita al menos un ingrediente';
  end if;

  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'El producto no existe';
  end if;

  insert into public.recipes (product_id, yield_portions, notes)
  values (p_product_id, p_yield_portions, nullif(btrim(p_notes), ''))
  on conflict (product_id) do update
    set yield_portions = excluded.yield_portions, notes = excluded.notes
  returning id into v_recipe;

  delete from public.recipe_items where recipe_id = v_recipe;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_ing   := (v_item ->> 'ingredient_id')::uuid;
    v_qty   := (v_item ->> 'quantity')::numeric;
    v_waste := coalesce((v_item ->> 'waste_pct')::numeric, 0);

    if v_ing is null or v_qty is null or v_qty <= 0 then
      raise exception 'Cada ingrediente necesita una cantidad mayor que cero';
    end if;
    if v_waste < 0 or v_waste > 100 then
      raise exception 'El desperdicio debe estar entre 0 y 100 por ciento';
    end if;
    if v_ing = any (v_seen) then
      raise exception 'Hay un ingrediente repetido en la receta';
    end if;
    v_seen := v_seen || v_ing;

    if not exists (select 1 from public.ingredients where id = v_ing and active) then
      raise exception 'Hay un ingrediente inválido o inactivo';
    end if;

    insert into public.recipe_items (recipe_id, ingredient_id, quantity, waste_pct)
    values (v_recipe, v_ing, round(v_qty, 3), round(v_waste, 2));
  end loop;

  return v_recipe;
end $$;

revoke all on function public.save_recipe(uuid, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_recipe(uuid, integer, text, jsonb) to authenticated;

commit;
