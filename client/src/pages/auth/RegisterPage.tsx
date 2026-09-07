import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

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
      <h1 className="mb-6 text-2xl font-semibold text-brand-700">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={f.name} className="mb-1 block text-sm font-medium">
              {f.label}
            </label>
            <input
              id={f.name}
              type={f.type}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              aria-invalid={!!errors[f.name]}
              aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
              {...register(f.name)}
            />
            {errors[f.name] && (
              <p id={`${f.name}-error`} className="mt-1 text-sm text-red-600">
                {errors[f.name]?.message}
              </p>
            )}
          </div>
        ))}
        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
