'use client';

import { useActionState } from 'react';
import { iniciarSesion, type EstadoLogin } from '@/app/login/actions';

export default function LoginForm() {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(iniciarSesion, { error: null });
  return (
    <form action={accion} className="card space-y-4 p-5">
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input
          id="password" name="password" type="password" required autoFocus maxLength={200}
          autoComplete="current-password" className="input"
          aria-describedby={estado.error ? 'login-error' : undefined}
        />
      </div>
      {estado.error && (
        <p id="login-error" role="alert" className="text-sm text-rojo">{estado.error}</p>
      )}
      <button type="submit" disabled={pendiente} className="btn btn-primary w-full">
        {pendiente ? 'Comprobando…' : 'Entrar'}
      </button>
    </form>
  );
}
