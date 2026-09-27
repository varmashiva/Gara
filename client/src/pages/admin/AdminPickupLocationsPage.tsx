import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchPickupLocations,
  createPickupLocation,
  setDefaultPickupLocation,
  deletePickupLocation,
  NewPickupLocation,
} from '@/features/admin/api';

// Mirrors the server's pickupLocationSchema, which in turn mirrors what
// Shiprocket's pickup API accepts.
const schema = z.object({
  label: z.string().min(1, 'Name is required').max(80),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
  addressLine1: z.string().trim().min(10, 'Address must be at least 10 characters (include house/flat no.)'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
  country: z.string().min(1),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const FIELDS: { name: keyof FormValues; label: string; wide?: boolean }[] = [
  { name: 'label', label: 'Location name (e.g. Main Kitchen)' },
  { name: 'contactPerson', label: 'Contact person' },
  { name: 'phone', label: 'Mobile number' },
  { name: 'postalCode', label: 'Pincode' },
  { name: 'addressLine1', label: 'Address line 1', wide: true },
  { name: 'addressLine2', label: 'Address line 2 (optional)', wide: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
];

export function AdminPickupLocationsPage() {
  const queryClient = useQueryClient();
  const { data: locations, isLoading } = useQuery({ queryKey: ['admin', 'pickup-locations'], queryFn: fetchPickupLocations });
  const [showForm, setShowForm] = useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'pickup-locations'] });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { country: 'India', isDefault: false } });

  const createMutation = useMutation({
    mutationFn: (payload: NewPickupLocation) => createPickupLocation(payload),
    onSuccess: () => {
      invalidate();
      reset();
      setShowForm(false);
    },
  });
  const defaultMutation = useMutation({ mutationFn: setDefaultPickupLocation, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deletePickupLocation, onSuccess: invalidate });

  const apiError =
    (createMutation.error as any)?.response?.data?.message ??
    (defaultMutation.error as any)?.response?.data?.message ??
    (deleteMutation.error as any)?.response?.data?.message;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-2xl font-semibold text-paper-50">Pickup locations</h1>
      <p className="mb-4 text-sm text-paper-400">
        Where Shiprocket's courier collects orders from. Each address is registered with Shiprocket when you add it;
        orders ship from the default one.
      </p>

      <button onClick={() => setShowForm((v) => !v)} className="mb-4 text-sm text-brand-300 underline">
        {showForm ? 'Cancel' : '+ New pickup location'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => createMutation.mutateAsync(values))}
          className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-paper-50/15 p-4"
        >
          {FIELDS.map((field) => (
            <div key={field.name} className={field.wide ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <label className="mb-1 block text-sm font-medium">{field.label}</label>
              <input className="w-full rounded-md border border-paper-50/20 px-3 py-2 text-sm" {...register(field.name)} />
              {errors[field.name] && <p className="text-sm text-red-600">{errors[field.name]?.message}</p>}
            </div>
          ))}
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isDefault')} />
            Make this the default pickup location
          </label>
          <div className="col-span-2 space-y-2">
            {apiError && <p className="text-sm text-red-600">{apiError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Registering with Shiprocket...' : 'Add pickup location'}
            </button>
          </div>
        </form>
      )}

      {!showForm && apiError && <p className="mb-3 text-sm text-red-600">{apiError}</p>}

      {isLoading ? (
        <p className="text-paper-400">Loading...</p>
      ) : !locations?.length ? (
        <p className="text-sm text-paper-400">No pickup locations yet — add one before shipping orders.</p>
      ) : (
        <ul className="divide-y divide-paper-50/10 rounded-lg border border-paper-50/10 bg-surface-50">
          {locations.map((loc) => (
            <li key={loc._id} className="flex items-start justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium">
                  {loc.label}
                  {loc.isDefault && <span className="ml-2 text-xs text-brand-300">Default</span>}
                  {loc.status !== 'ACTIVE' && (
                    <span className="ml-2 text-xs text-paper-600">Not registered — will register on first shipment</span>
                  )}
                </p>
                <p className="text-paper-400">
                  {loc.contactPerson} · {loc.phone}
                </p>
                <p className="text-paper-400">
                  {loc.addressLine1}
                  {loc.addressLine2 ? `, ${loc.addressLine2}` : ''}, {loc.city}, {loc.state} {loc.postalCode}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!loc.isDefault && (
                  <button
                    onClick={() => defaultMutation.mutate(loc._id)}
                    className="rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete pickup location "${loc.label}"?`)) deleteMutation.mutate(loc._id);
                  }}
                  className="rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium text-paper-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
