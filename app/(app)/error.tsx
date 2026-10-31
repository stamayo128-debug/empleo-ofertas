'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <h1 className="mb-2 text-lg font-semibold">No se pudieron cargar los datos</h1>
      <p className="meta mb-4">Ha habido un problema al consultar la base de datos. Inténtalo de nuevo en unos minutos.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>Reintentar</button>
    </div>
  );
}
