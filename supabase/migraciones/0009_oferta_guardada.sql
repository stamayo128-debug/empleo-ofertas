-- Aplicada en Supabase (proyecto busqueda-empleo) el 2026-10-31 como "0009_oferta_guardada".
-- Esta copia es solo documentación: la app no crea ni modifica el esquema.
--
-- 1) Columna nueva para "guardar" una oferta y verla después (timestamptz; null = no guardada).
-- 2) Índice parcial para listar las guardadas.
-- 3) v_ofertas_web con la columna guardada_en AL FINAL (create or replace no permite reordenar).
--
-- OJO: "create or replace view" reinicia las opciones de la vista. Hay que volver a poner
--   alter view public.v_ofertas_web set (security_invoker = true);
-- (aplicado como "0009b_restaurar_security_invoker_v_ofertas_web").
alter table public.ofertas add column if not exists guardada_en timestamptz;
create index if not exists ofertas_guardada_en_idx
  on public.ofertas (guardada_en desc) where guardada_en is not null;
-- La definición completa de la vista (la anterior + "o.guardada_en" como última columna) está en la migración aplicada.
