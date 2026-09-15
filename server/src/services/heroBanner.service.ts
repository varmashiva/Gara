import { HeroBanner, HeroBannerDocument } from '../models/HeroBanner';
import { storageProvider } from '../integrations/storage/storageProviderFactory';
import { recordAudit } from './audit.service';
import { UpdateHeroBannerInput } from '../schemas/heroBanner.schema';

const DEFAULTS = {
  eyebrow: 'Serving since day one',
  headline: 'Something worth craving, made at home',
  subtext:
    'Gara brings you pickles, sweets, and snacks made the way they were always meant to be made, in real kitchens, in small batches.',
  ctaText: 'Browse the menu',
  ctaLink: '/products',
};

async function getOrCreateHeroBanner(): Promise<HeroBannerDocument> {
  const existing = await HeroBanner.findOne();
  if (existing) return existing;
  return HeroBanner.create(DEFAULTS);
}

export async function getHeroBanner() {
  return getOrCreateHeroBanner();
}

export async function updateHeroBanner(adminUserId: string, input: UpdateHeroBannerInput) {
  const hero = await getOrCreateHeroBanner();
  Object.assign(hero, input);
  hero.updatedBy = adminUserId as unknown as typeof hero.updatedBy;
  await hero.save();

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'HERO_BANNER_UPDATED',
    entityType: 'HeroBanner',
    entityId: hero.id,
    after: input,
  });

  return hero;
}

export async function removeHeroBannerImage(adminUserId: string) {
  const hero = await getOrCreateHeroBanner();
  const publicId = hero.image?.publicId;
  if (!publicId) return hero;

  hero.image = undefined;
  hero.updatedBy = adminUserId as unknown as typeof hero.updatedBy;
  await hero.save();

  storageProvider.delete(publicId).catch(() => undefined);

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'HERO_BANNER_IMAGE_REMOVED',
    entityType: 'HeroBanner',
    entityId: hero.id,
  });

  return hero;
}

export async function updateHeroBannerImage(adminUserId: string, file: Express.Multer.File) {
  const hero = await getOrCreateHeroBanner();
  const previousPublicId = hero.image?.publicId;

  const { url, publicId } = await storageProvider.upload({
    buffer: file.buffer,
    mimeType: file.mimetype,
    folder: 'hero-banner',
  });

  hero.image = { url, publicId };
  hero.updatedBy = adminUserId as unknown as typeof hero.updatedBy;
  await hero.save();

  // Best-effort cleanup of the old image — never let this block the
  // response, the new image is already saved and live.
  if (previousPublicId) {
    storageProvider.delete(previousPublicId).catch(() => undefined);
  }

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'HERO_BANNER_IMAGE_UPDATED',
    entityType: 'HeroBanner',
    entityId: hero.id,
  });

  return hero;
}
