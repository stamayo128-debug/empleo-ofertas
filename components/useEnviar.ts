'use client';

import { deshacerEnvios, marcarEnviadas, type CambioEnvio } from '@/lib/actions';
import { fmtCorta } from '@/lib/format';
import { useToast } from './Toast';

/** Marca ofertas como enviadas y muestra el aviso con "Deshacer". Devuelve true si se guardó. */
export function useEnviar() {
  const toast = useToast();

  async function deshacer(cambios: CambioEnvio[]) {
    // Solo los tres campos que acepta la acción (el esquema rechaza claves extra).
    const items = cambios.map(({ id, estado_anterior, fecha_envio_anterior }) => ({ id, estado_anterior, fecha_envio_anterior }));
    try {
      const r = await deshacerEnvios(items);
      toast.mostrar(r.ok ? 'Envío deshecho' : r.error);
    } catch {
      toast.mostrar('No se pudo guardar');
    }
  }

  async function marcar(ids: number[]): Promise<boolean> {
    let r: Awaited<ReturnType<typeof marcarEnviadas>>;
    try {
      r = await marcarEnviadas(ids);
    } catch {
      r = { ok: false, error: 'No se pudo guardar' };
    }
    if (!r.ok) {
      toast.mostrar(r.error);
      return false;
    }
    const cambios = r.cambios;
    const texto = cambios.length === 1
      ? `Solicitud marcada como enviada${cambios[0]?.proximo_seguimiento ? ` · seguimiento el ${fmtCorta(cambios[0].proximo_seguimiento)}` : ''}`
      : `${cambios.length} solicitudes marcadas como enviadas`;
    toast.mostrar(texto, { etiqueta: 'Deshacer', fn: () => { void deshacer(cambios); } });
    return true;
  }

  return { marcar };
}
