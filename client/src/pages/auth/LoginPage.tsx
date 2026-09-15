import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Login failed');
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Sign in</p>
      <h1 className="mb-6 mt-1 font-display text-3xl font-semibold text-paper-50">Welcome back</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-paper-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-brand-300">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-paper-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-brand-300">
              {errors.password.message}
            </p>
          )}
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-brand-300">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-pill-primary disabled:opacity-60">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-paper-600">
            <span className="h-px flex-1 bg-paper-50/15" />
            or
            <span className="h-px flex-1 bg-paper-50/15" />
          </div>
          <GoogleSignInButton />
        </>
      )}
      <p className="mt-4 text-sm text-paper-400">
        No account?{' '}
        <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-300">
          Register
        </Link>
      </p>
    </div>
  );
}
