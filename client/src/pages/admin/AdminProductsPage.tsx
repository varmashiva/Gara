import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAdminProducts,
  useCreateAdminProduct,
  useUploadAdminProductImage,
  useDeleteAdminProductImage,
  useDecideProduct,
  useUpdateAdminProduct,
  useDeleteAdminProduct,
} from '@/features/admin/hooks';
import { useCategories } from '@/features/products/hooks';
import { formatPaise } from '@/utils/currency';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { X } from 'lucide-react';
import type { Product } from '@/types/product';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface-100 text-paper-300',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-500/15 text-green-300',
  REJECTED: 'bg-red-500/15 text-red-400',
  INACTIVE: 'bg-surface-100 text-paper-400',
};

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Pending review', value: 'PENDING_REVIEW' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const productSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  name: z.string().min(2),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  isVeg: z.enum(['true', 'false']),
  availableStock: z.coerce.number().int().min(0),
});
type ProductFormValues = z.infer<typeof productSchema>;

export function AdminProductsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading } = useAdminProducts(filter);
  const { data: categories } = useCategories();
  const createMutation = useCreateAdminProduct();
  const uploadMutation = useUploadAdminProductImage();
  const deleteImageMutation = useDeleteAdminProductImage();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const decide = useDecideProduct();
  const updateMutation = useUpdateAdminProduct();
  const deleteMutation = useDeleteAdminProduct();

  const createForm = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });
  const editForm = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });

  const createApiError = (createMutation.error as any)?.response?.data?.message;
  const editApiError = (updateMutation.error as any)?.response?.data?.message;

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    editForm.reset({
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      price: p.price,
      isVeg: p.isVeg ? 'true' : 'false',
      availableStock: p.inventory.availableStock,
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f.value ? 'bg-brand-600 text-white' : 'border border-paper-50/20 text-paper-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-pill-primary !px-4 !py-2 text-sm"
        >
          {showForm ? 'Cancel' : '+ New product'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createForm.handleSubmit((values) =>
            createMutation.mutate(
              { ...values, isVeg: values.isVeg === 'true' },
              { onSuccess: () => { createForm.reset(); setShowForm(false); } }
            )
          )}
          className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-paper-50/15 p-4"
        >
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('name')} />
            {createForm.formState.errors.name && (
              <p className="text-sm text-red-400">{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('description')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('categoryId')}>
              <option value="">Select...</option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {createForm.formState.errors.categoryId && (
              <p className="text-sm text-red-400">{createForm.formState.errors.categoryId.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Veg?</label>
            <select className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('isVeg')}>
              <option value="true">Vegetarian</option>
              <option value="false">Non-vegetarian</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price (paise)</label>
            <input type="number" className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('price')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Stock</label>
            <input type="number" className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...createForm.register('availableStock')} />
          </div>
          <div className="col-span-2">
            {createApiError && <p className="mb-2 text-sm text-red-400">{createApiError}</p>}
            <button
              type="submit"
              disabled={createForm.formState.isSubmitting}
              className="btn-pill-primary !px-5 !py-2.5 text-sm disabled:opacity-60"
            >
              Create product
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-paper-400">Loading...</p>}
      {!isLoading && (!data || data.length === 0) && <p className="text-paper-400">No products found.</p>}

      <ul className="space-y-3">
        {data?.map((p) =>
          editingId === p._id ? (
            <li key={p._id} className="rounded-lg border border-brand-200 bg-brand-500/15 p-4">
              <form
                onSubmit={editForm.handleSubmit((values) =>
                  updateMutation.mutate(
                    {
                      id: p._id,
                      edits: { ...values, isVeg: values.isVeg === 'true' },
                    },
                    { onSuccess: () => setEditingId(null) }
                  )
                )}
                className="grid grid-cols-2 gap-3"
              >
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('name')} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('description')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <select className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('categoryId')}>
                    {categories?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Veg?</label>
                  <select className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('isVeg')}>
                    <option value="true">Vegetarian</option>
                    <option value="false">Non-vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Price (paise)</label>
                  <input type="number" className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('price')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock</label>
                  <input type="number" className="w-full rounded-md border border-paper-50/20 bg-surface-50 px-3 py-2 text-sm" {...editForm.register('availableStock')} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {editApiError && <p className="text-sm text-red-400">{editApiError}</p>}
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-paper-50/20 px-4 py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </li>
          ) : (
            <li key={p._id} className="flex flex-col gap-3 rounded-lg border border-paper-50/10 bg-surface-50 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-wrap gap-2">
                {p.images.length > 0 ? (
                  p.images.map((img) => (
                    <div key={img.publicId} className="relative h-16 w-16 shrink-0">
                      <img src={img.url} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this image?')) {
                            deleteImageMutation.mutate({ id: p._id, publicId: img.publicId });
                          }
                        }}
                        aria-label="Remove image"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow hover:bg-brand-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <ImagePlaceholder className="h-16 w-16 rounded-md" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-paper-400">{formatPaise(p.price)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                  {p.status.replace(/_/g, ' ')}
                </span>
                <p className="mt-1 text-xs text-paper-600">{p.images.length}/8 images</p>
              </div>
              <input
                ref={(el) => (fileInputs.current[p._id] = el)}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length === 0) return;
                  setUploadingId(p._id);
                  try {
                    // Uploaded one at a time on purpose: each upload does a
                    // read-modify-write on the product's images array, so
                    // parallel requests could race and drop an image.
                    for (const file of files) {
                      await uploadMutation.mutateAsync({ id: p._id, file });
                    }
                  } finally {
                    setUploadingId(null);
                  }
                }}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => fileInputs.current[p._id]?.click()}
                  disabled={uploadingId === p._id || p.images.length >= 8}
                  className="rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {uploadingId === p._id ? 'Uploading...' : 'Add images'}
                </button>
                {p.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => decide.mutate({ id: p._id, decision: 'APPROVED' })}
                      disabled={decide.isPending}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide.mutate({ id: p._id, decision: 'REJECTED' })}
                      disabled={decide.isPending}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${p.name}"? This can't be undone from here.`)) {
                      deleteMutation.mutate(p._id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded-md border border-red-500/25 px-3 py-1.5 text-xs font-medium text-red-400 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
