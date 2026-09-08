import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as api from '@/features/sellers/productApi';
import { useCategories } from '@/features/products/hooks';
import { formatPaise } from '@/utils/currency';

const schema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  name: z.string().min(2),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  isVeg: z.enum(['true', 'false']),
  availableStock: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
};

export function SellerProductsPage() {
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['seller', 'products'], queryFn: api.fetchMyProducts });
  const { data: categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.createMyProduct({ ...values, isVeg: values.isVeg === 'true' }),
    onSuccess: () => {
      invalidate();
      reset();
      setShowForm(false);
    },
  });

  const submitMutation = useMutation({ mutationFn: api.submitForReview, onSuccess: invalidate });
  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadProductImage(id, file),
    onSuccess: invalidate,
  });

  const apiError = (createMutation.error as any)?.response?.data?.message;

  return (
    <div>
      <button onClick={() => setShowForm((v) => !v)} className="mb-4 text-sm text-brand-600 underline">
        {showForm ? 'Cancel' : '+ New product'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4"
        >
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('description')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('categoryId')}>
              <option value="">Select...</option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Veg?</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('isVeg')}>
              <option value="true">Vegetarian</option>
              <option value="false">Non-vegetarian</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price (paise)</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('price')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Stock</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('availableStock')} />
          </div>
          <div className="col-span-2">
            {apiError && <p className="mb-2 text-sm text-red-600">{apiError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Create product (draft)
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {products?.map((p) => (
          <li key={p._id} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4">
            {p.images[0] ? (
              <img src={p.images[0].url} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-orange-50 text-2xl">🍽️</div>
            )}
            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">{formatPaise(p.price)}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                {p.status.replace(/_/g, ' ')}
              </span>
            </div>
            <input
              ref={(el) => (fileInputs.current[p._id] = el)}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate({ id: p._id, file });
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputs.current[p._id]?.click()}
              disabled={uploadMutation.isPending}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              Add image
            </button>
            {p.status === 'DRAFT' && (
              <button
                onClick={() => submitMutation.mutate(p._id)}
                disabled={submitMutation.isPending}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Submit for review
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
