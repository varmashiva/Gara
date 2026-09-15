import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LocateFixed } from 'lucide-react';
import { useCreateAddress, useUpdateAddress } from '@/features/orders/hooks';
import type { Address } from '@/types/order';

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

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export function AddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const isEditing = !!address;
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? '',
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        }
      : { country: 'India' },
  });

  async function onSubmit(values: FormValues) {
    if (isEditing) {
      await updateAddress.mutateAsync({ id: address._id, ...values });
    } else {
      await createAddress.mutateAsync({ ...values, isDefault: true });
    }
    onDone();
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported on this device.');
      return;
    }
    setLocationError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          if (!res.ok) throw new Error('Lookup failed');
          const data: { address?: NominatimAddress; display_name?: string } = await res.json();
          const a = data.address ?? {};

          const line1 =
            [a.house_number, a.road].filter(Boolean).join(' ') ||
            a.neighbourhood ||
            a.suburb ||
            data.display_name?.split(',')[0] ||
            '';

          setValue('addressLine1', line1, { shouldDirty: true, shouldValidate: true });
          setValue('city', a.city ?? a.town ?? a.village ?? a.county ?? '', { shouldDirty: true, shouldValidate: true });
          setValue('state', a.state ?? '', { shouldDirty: true, shouldValidate: true });
          setValue('postalCode', a.postcode ?? '', { shouldDirty: true, shouldValidate: true });
          setValue('country', a.country ?? 'India', { shouldDirty: true, shouldValidate: true });
        } catch {
          setLocationError('Could not look up your address from that location. Please fill it in manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Please enter your address manually.'
            : 'Could not get your current location. Please enter your address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-full border border-paper-50/20 px-4 py-2 text-sm font-medium text-paper-200 transition hover:border-brand-400/40 hover:text-brand-300 disabled:opacity-60"
        >
          <LocateFixed size={16} />
          {locating ? 'Finding your location...' : 'Use my current location'}
        </button>
        {locationError && <p className="mt-2 text-sm text-brand-300">{locationError}</p>}
      </div>
      {fields.map((f) => (
        <div key={f.name} className={f.name === 'addressLine1' || f.name === 'addressLine2' ? 'sm:col-span-2' : ''}>
          <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-paper-200">
            {f.label}
          </label>
          <input id={f.name} className="input" {...register(f.name)} />
          {errors[f.name] && <p className="mt-1 text-sm text-brand-300">{errors[f.name]?.message}</p>}
        </div>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className="btn-pill-primary !px-5 !py-2.5 disabled:opacity-60">
          {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
