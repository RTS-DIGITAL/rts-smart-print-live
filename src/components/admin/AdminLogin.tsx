import { useState, type FormEvent } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { getErrorMessage } from '@/lib/errors';
import { printService } from '@/services/printService';

export function AdminLogin() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') await printService.signIn(email.trim(), password);
      else await printService.signUp(email.trim(), password);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const isSignIn = mode === 'signin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="text-xl font-semibold text-slate-900">Shop admin</h1>
          <p className="text-sm text-slate-500">
            {isSignIn ? 'Sign in to manage orders, pricing and printers.' : 'Create an admin account for your shop.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium text-slate-700">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            {isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isSignIn ? 'signup' : 'signin');
            setError(null);
          }}
          className="mt-5 w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          {isSignIn ? 'New here? Create an admin account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
