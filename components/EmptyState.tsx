export default function EmptyState({ children, acciones }: { children: React.ReactNode; acciones?: React.ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <p className="mx-auto max-w-prose">{children}</p>
      {acciones && <div className="mt-4 flex flex-wrap justify-center gap-3">{acciones}</div>}
    </div>
  );
}
