import { ESTADO_CLASE } from '@/lib/constantes';

export function EncajeBadge({ encaje }: { encaje: string }) {
  return encaje === 'Alto' ? (
    <span className="badge border-accent bg-accent text-on-accent">Alto</span>
  ) : (
    <span className="badge border-border text-muted">{encaje}</span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  return <span className={`badge ${ESTADO_CLASE[estado] ?? 'text-muted border-border'}`}>{estado}</span>;
}
