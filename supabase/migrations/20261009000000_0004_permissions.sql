-- =============================================================================
-- Heart Desserts · Migración 0004
-- Agrega profiles.permissions (módulos permitidos por usuario). El código ya
-- escribía esta columna, pero no existía ni tenía permiso de UPDATE.
-- =============================================================================

begin;

alter table public.profiles
  add column permissions text[] not null default '{}';

grant update (permissions) on public.profiles to authenticated;

commit;
