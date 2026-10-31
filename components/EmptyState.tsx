import { Inbox } from 'lucide-react';

export default function EmptyState({
  children, acciones, icono,
}: { children: React.ReactNode; acciones?: React.ReactNode; icono?: React.ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden>
        {icono ?? <Inbox size={26} />}
      </span>
      <p className="mx-auto max-w-prose">{children}</p>
      {acciones && <div className="mt-4 flex flex-wrap justify-center gap-3">{acciones}</div>}
    </div>
  );
}
