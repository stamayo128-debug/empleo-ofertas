import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { haySesion } from '@/lib/session';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await haySesion()) redirect('/');
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <span className="mb-5 grid size-14 place-items-center rounded-full text-on-accent shadow-btn" style={{ backgroundImage: 'var(--grad-cta)' }}>
        <Briefcase size={26} aria-hidden />
      </span>
      <h1 className="mb-1 text-2xl font-semibold">Ofertas</h1>
      <p className="meta mb-6">Acceso privado.</p>
      <LoginForm />
    </main>
  );
}
