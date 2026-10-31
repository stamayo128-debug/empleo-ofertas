'use client';

import { AlertTriangle } from 'lucide-react';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-surface-2 text-ambar" aria-hidden>
        <AlertTriangle size={26} />
      </span>
      <h1 className="mb-2 text-lg font-semibold">No se pudieron cargar los datos</h1>
      <p className="meta mb-4">Ha habido un problema al consultar la base de datos. Inténtalo de nuevo en unos minutos.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>Reintentar</button>
    </div>
  );
}
