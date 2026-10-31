/** Esqueleto que se muestra al navegar entre pantallas, para que la app no parezca congelada. */
export default function Cargando() {
  return (
    <div className="max-w-[760px] space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-11 w-28 shrink-0 animate-pulse rounded-tile bg-border" />)}
      </div>
      <div className="h-11 animate-pulse rounded-tile bg-border" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card space-y-2 p-4">
          <div className="h-4 w-1/4 animate-pulse rounded bg-border" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
