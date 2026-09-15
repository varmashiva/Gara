import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
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
      await registerUser(values);
      navigate('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Registration failed');
    }
  }

  const fields: Array<{ name: keyof FormValues; label: string; type: string }> = [
    { name: 'firstName', label: 'First name', type: 'text' },
    { name: 'lastName', label: 'Last name', type: 'text' },
    { name: 'username', label: 'Username', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Password', type: 'password' },
  ];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Join Gara</p>
      <h1 className="mb-6 mt-1 font-display text-3xl font-semibold text-paper-50">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-paper-200">
              {f.label}
            </label>
            <input
              id={f.name}
              type={f.type}
              className="input"
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
              {...register(f.name)}
            />
            {errors[f.name] && (
              <p id={`${f.name}-error`} className="mt-1 text-sm text-brand-300">
                {errors[f.name]?.message}
              </p>
            )}
          </div>
        ))}
        {serverError && (
          <p role="alert" className="text-sm text-brand-300">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-pill-primary disabled:opacity-60">
          {isSubmitting ? 'Creating account...' : 'Create account'}
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
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
