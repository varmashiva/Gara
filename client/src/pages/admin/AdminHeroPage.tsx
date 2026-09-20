import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import {
  useAdminHeroBanner,
  useUpdateHeroBanner,
  useUploadHeroBannerImage,
  useRemoveHeroBannerImage,
  useAdminHomeHighlight,
  useUpdateHomeHighlight,
} from '@/features/admin/hooks';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

const heroSchema = z.object({
  eyebrow: z.string().min(1, 'Required').max(60),
  headline: z.string().min(1, 'Required').max(150),
  subtext: z.string().min(1, 'Required').max(300),
  ctaText: z.string().min(1, 'Required').max(40),
  ctaLink: z.string().min(1, 'Required').max(200),
});
type HeroFormValues = z.infer<typeof heroSchema>;

const highlightSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.string().min(1, 'Required').max(8),
        label: z.string().min(1, 'Required').max(60),
      })
    )
    .min(1, 'Add at least one')
    .max(6, 'Up to 6 only'),
});
type HighlightFormValues = z.infer<typeof highlightSchema>;

export function AdminHeroPage() {
  const { data: hero, isLoading } = useAdminHeroBanner();
  const updateMutation = useUpdateHeroBanner();
  const uploadMutation = useUploadHeroBannerImage();
  const removeImageMutation = useRemoveHeroBannerImage();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HeroFormValues>({ resolver: zodResolver(heroSchema) });

  useEffect(() => {
    if (hero) {
      reset({
        eyebrow: hero.eyebrow,
        headline: hero.headline,
        subtext: hero.subtext,
        ctaText: hero.ctaText,
        ctaLink: hero.ctaLink,
      });
    }
  }, [hero, reset]);

  const apiError = (updateMutation.error as any)?.response?.data?.message;

  if (isLoading) return <p className="text-paper-400">Loading...</p>;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-paper-400">
        This is what customers see at the top of the home page. Update it for a festival, a sale, or any
        occasion, then save, it goes live immediately.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          className="card space-y-4 p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Eyebrow</label>
            <input className="input" {...register('eyebrow')} />
            {errors.eyebrow && <p className="mt-1 text-sm text-brand-400">{errors.eyebrow.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Headline</label>
            <input className="input" {...register('headline')} />
            {errors.headline && <p className="mt-1 text-sm text-brand-400">{errors.headline.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subtext</label>
            <textarea rows={3} className="input" {...register('subtext')} />
            {errors.subtext && <p className="mt-1 text-sm text-brand-400">{errors.subtext.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Button text</label>
              <input className="input" {...register('ctaText')} />
              {errors.ctaText && <p className="mt-1 text-sm text-brand-400">{errors.ctaText.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Button link</label>
              <input className="input" placeholder="/products" {...register('ctaLink')} />
              {errors.ctaLink && <p className="mt-1 text-sm text-brand-400">{errors.ctaLink.message}</p>}
            </div>
          </div>

          {apiError && <p className="text-sm text-brand-400">{apiError}</p>}
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="btn-pill-primary !px-5 !py-2.5 text-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
          {updateMutation.isSuccess && !isDirty && (
            <span className="ml-3 text-sm text-green-400">Saved</span>
          )}
        </form>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-medium">Hero photo</h2>
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-200">
            {hero?.image ? (
              <img src={hero.image.url} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              e.target.value = '';
            }}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploadMutation.isPending}
              className="btn-pill-outline !px-4 !py-2 text-sm disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Uploading...' : hero?.image ? 'Replace photo' : 'Upload photo'}
            </button>
            {hero?.image && (
              <button
                onClick={() => removeImageMutation.mutate()}
                disabled={removeImageMutation.isPending}
                className="rounded-full border border-red-500/25 px-4 py-2 text-sm font-medium text-red-400 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <HighlightsEditor />
    </div>
  );
}

function HighlightsEditor() {
  const { data: highlight, isLoading } = useAdminHomeHighlight();
  const updateMutation = useUpdateHomeHighlight();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HighlightFormValues>({ resolver: zodResolver(highlightSchema) });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (highlight) reset({ items: highlight.items });
  }, [highlight, reset]);

  const apiError = (updateMutation.error as any)?.response?.data?.message;

  if (isLoading) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-1 font-display text-lg font-semibold text-paper-50">Highlight tiles</h2>
      <p className="mb-4 max-w-2xl text-sm text-paper-400">
        The small icon + label cards shown next to the live menu/item counts on the home page.
      </p>
      <form
        onSubmit={handleSubmit((values) => updateMutation.mutate(values.items))}
        className="card max-w-2xl space-y-3 p-5"
      >
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="w-16 shrink-0">
              <input
                className="input text-center"
                placeholder="🌿"
                aria-label={`Icon for tile ${i + 1}`}
                {...register(`items.${i}.icon` as const)}
              />
            </div>
            <div className="flex-1">
              <input
                className="input"
                placeholder="Label"
                aria-label={`Label for tile ${i + 1}`}
                {...register(`items.${i}.label` as const)}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={fields.length <= 1}
              aria-label={`Remove tile ${i + 1}`}
              className="mt-1 shrink-0 text-paper-400 hover:text-brand-400 disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>
        ))}
        {errors.items?.message && <p className="text-sm text-brand-400">{errors.items.message}</p>}

        <button
          type="button"
          onClick={() => append({ icon: '✨', label: '' })}
          disabled={fields.length >= 6}
          className="btn-pill-outline !px-4 !py-2 text-sm disabled:opacity-50"
        >
          <Plus size={14} /> Add tile
        </button>

        <div>
          {apiError && <p className="mb-2 text-sm text-brand-400">{apiError}</p>}
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="btn-pill-primary !px-5 !py-2.5 text-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
          {updateMutation.isSuccess && !isDirty && (
            <span className="ml-3 text-sm text-green-400">Saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
