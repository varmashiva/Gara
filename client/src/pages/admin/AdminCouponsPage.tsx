import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchCoupons, createCoupon, updateCouponStatus, NewCoupon } from '@/features/admin/couponApi';

// z.coerce.number() runs before .optional() is checked, so an empty string
// from a blank optional input coerces to 0 and fails .positive() silently —
// preprocess blank strings to undefined first so "optional" actually means
// optional for these fields.
const optionalPositiveInt = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.coerce.number().int().positive().optional()
);

const schema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.coerce.number().positive(),
  usageLimit: optionalPositiveInt,
  perUserLimit: optionalPositiveInt,
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const { data: coupons } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: fetchCoupons });
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { discountType: 'PERCENTAGE' } });

  const createMutation = useMutation({
    mutationFn: (payload: NewCoupon) => createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      reset();
      setShowForm(false);
    },
  });
  const apiError = (createMutation.error as any)?.response?.data?.message;
  const validationErrors = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean);

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'DISABLED' }) => updateCouponStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });

  async function onSubmit(values: FormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div>
      <button onClick={() => setShowForm((v) => !v)} className="mb-4 text-sm text-brand-600 underline">
        {showForm ? 'Cancel' : '+ New coupon'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('code')} />
            {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('discountType')}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount (paise)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount value</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('discountValue')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Usage limit (optional)</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('usageLimit')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Start date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('startDate')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('endDate')} />
          </div>
          <div className="col-span-2 space-y-2">
            {validationErrors.length > 0 && (
              <ul className="text-sm text-red-600">
                {validationErrors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
            {apiError && <p className="text-sm text-red-600">{apiError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Create coupon
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
        {coupons?.map((c) => (
          <li key={c._id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{c.code}</p>
              <p className="text-gray-500">
                {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${(c.discountValue / 100).toFixed(2)}`} ·
                Used {c.usedCount}
                {c.usageLimit ? `/${c.usageLimit}` : ''}
              </p>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: c._id, status: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium"
            >
              {c.status === 'ACTIVE' ? 'Disable' : 'Enable'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
