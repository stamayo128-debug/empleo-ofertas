-- Copia de documentación de la migración 0011 (ya aplicada en Supabase).
-- Catálogo de búsquedas: cada búsqueda se etiqueta con un tema y un sitio. Solo añade; no cambia parámetros ni estado.
create table if not exists public.temas_busqueda (
  clave text primary key,
  nombre text not null,
  descripcion text,
  orden integer not null default 0
);
alter table public.temas_busqueda enable row level security;
alter table public.consultas add column if not exists tema text references public.temas_busqueda(clave);
alter table public.consultas add column if not exists sitio text;
-- Temas: automatizacion, ia, transformacion, junior, funcional, datos, desarrollo, adyacentes, empresas.
-- Sitios: nombre de la ubicación (Leganés, Bilbao…), «remoto» o «varios».
