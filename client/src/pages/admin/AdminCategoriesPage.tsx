import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/admin/hooks';
import type { AdminCategory } from '@/features/admin/api';

const newCategorySchema = z.object({
  icon: z.string().min(1, 'Required').max(8),
  name: z.string().min(1, 'Required').max(60),
});
type NewCategoryValues = z.infer<typeof newCategorySchema>;

export function AdminCategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewCategoryValues>({ resolver: zodResolver(newCategorySchema) });

  const apiError = (createMutation.error as any)?.response?.data?.message;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-paper-400">
        These are the categories shown on the home page and used to filter the menu. Changes to the name,
        icon, or visibility go live immediately.
      </p>

      <button onClick={() => setShowForm((v) => !v)} className="mb-4 text-sm text-brand-300 underline">
        {showForm ? 'Cancel' : '+ New category'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => {
            createMutation.mutate(values, { onSuccess: () => { reset(); setShowForm(false); } });
          })}
          className="mb-6 flex flex-wrap items-start gap-3 rounded-lg border border-paper-50/15 p-4"
        >
          <div className="w-20">
            <label className="mb-1 block text-sm font-medium">Icon</label>
            <input className="input text-center" placeholder="🥒" {...register('icon')} />
            {errors.icon && <p className="mt-1 text-sm text-brand-400">{errors.icon.message}</p>}
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="input" placeholder="Category name" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-brand-400">{errors.name.message}</p>}
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-pill-primary mt-6 !px-5 !py-2.5 text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </button>
          {apiError && <p className="w-full text-sm text-brand-400">{apiError}</p>}
        </form>
      )}

      {isLoading ? (
        <p className="text-paper-400">Loading...</p>
      ) : (
        <ul className="divide-y divide-paper-50/10 rounded-lg border border-paper-50/10 bg-surface-50">
          {categories?.map((c) => (
            <CategoryRow
              key={c._id}
              category={c}
              onSave={(edits) => updateMutation.mutate({ id: c._id, edits })}
              onToggleActive={() => updateMutation.mutate({ id: c._id, edits: { isActive: !c.isActive } })}
              onDelete={() => deleteMutation.mutate(c._id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// Local draft, committed onBlur rather than on every keystroke — same
// reasoning as the cart quantity fix: a field bound straight to a value
// that round-trips to the server fights whatever the admin is mid-typing.
function CategoryRow({
  category,
  onSave,
  onToggleActive,
  onDelete,
}: {
  category: AdminCategory;
  onSave: (edits: { name?: string; icon?: string }) => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [icon, setIcon] = useState(category.icon ?? '');
  const [name, setName] = useState(category.name);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setIcon(category.icon ?? '');
      setName(category.name);
    }
  }, [category.icon, category.name, focused]);

  function commit() {
    const edits: { name?: string; icon?: string } = {};
    if (name.trim() && name !== category.name) edits.name = name.trim();
    if (icon !== (category.icon ?? '')) edits.icon = icon;
    if (Object.keys(edits).length > 0) onSave(edits);
  }

  return (
    <li className="flex flex-wrap items-center gap-3 p-4 text-sm">
      <input
        value={icon}
        onFocus={() => setFocused(true)}
        onChange={(e) => setIcon(e.target.value)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        className="input w-14 !py-1.5 text-center"
        aria-label={`Icon for ${category.name}`}
      />
      <input
        value={name}
        onFocus={() => setFocused(true)}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        className="input min-w-[10rem] flex-1 !py-1.5"
        aria-label="Category name"
      />
      <span className={`text-xs font-medium ${category.isActive ? 'text-green-600' : 'text-paper-400'}`}>
        {category.isActive ? 'Visible' : 'Hidden'}
      </span>
      <button
        onClick={onToggleActive}
        className="rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium hover:bg-surface-100"
      >
        {category.isActive ? 'Hide' : 'Show'}
      </button>
      <button
        onClick={() => {
          if (confirm(`Delete "${category.name}"? Products in it keep their reference but it'll disappear from admin lists too.`)) {
            onDelete();
          }
        }}
        aria-label={`Delete ${category.name}`}
        className="text-paper-400 hover:text-brand-400"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
