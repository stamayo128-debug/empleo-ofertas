-- Aplicada en Supabase (proyecto busqueda-empleo) el 2026-11-01 como "0010_ubicaciones".
-- Esta copia es solo documentación: la app no crea ni modifica el esquema.
-- Sitios donde se busca trabajo, con radio en km. Es una REFERENCIA visible en Ajustes: de momento el agente
-- no la lee y sigue buscando con sus consultas (tabla "consultas"). Añadir un sitio aquí no hace que busque allí.
create table if not exists public.ubicaciones (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) between 2 and 80),
  radio_km integer not null default 25 check (radio_km between 1 and 200),
  activa boolean not null default true,
  orden integer not null default 0,
  creada_en timestamptz not null default now()
);
create unique index if not exists ubicaciones_nombre_uk on public.ubicaciones (lower(btrim(nombre)));
alter table public.ubicaciones enable row level security;
insert into public.ubicaciones (nombre, radio_km, orden) values ('Leganés', 25, 1), ('Bilbao', 25, 2) on conflict do nothing;
