import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAddress } from '@/features/orders/hooks';

const schema = z.object({
  fullName: z.string().min(1, 'Required'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  addressLine1: z.string().min(1, 'Required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  postalCode: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

export function AddressForm({ onCreated }: { onCreated: () => void }) {
  const createAddress = useCreateAddress();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { country: 'India' } });

  async function onSubmit(values: FormValues) {
    await createAddress.mutateAsync({ ...values, isDefault: true });
    onCreated();
  }

  const fields: Array<{ name: keyof FormValues; label: string }> = [
    { name: 'fullName', label: 'Full name' },
    { name: 'phone', label: 'Phone' },
    { name: 'addressLine1', label: 'Address line 1' },
    { name: 'addressLine2', label: 'Address line 2 (optional)' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'postalCode', label: 'Postal code' },
    { name: 'country', label: 'Country' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
      {fields.map((f) => (
        <div key={f.name} className={f.name === 'addressLine1' || f.name === 'addressLine2' ? 'sm:col-span-2' : ''}>
          <label htmlFor={f.name} className="mb-1 block text-sm font-medium">
            {f.label}
          </label>
          <input
            id={f.name}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register(f.name)}
          />
          {errors[f.name] && <p className="mt-1 text-sm text-red-600">{errors[f.name]?.message}</p>}
        </div>
      ))}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
