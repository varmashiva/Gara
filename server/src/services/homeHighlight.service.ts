import { HomeHighlight, HomeHighlightDocument } from '../models/HomeHighlight';
import { recordAudit } from './audit.service';
import { UpdateHomeHighlightInput } from '../schemas/homeHighlight.schema';

const DEFAULTS = {
  items: [
    { icon: '🌿', label: 'Small-batch & fresh' },
    { icon: '🚚', label: 'Delivered near you' },
  ],
};

async function getOrCreateHomeHighlight(): Promise<HomeHighlightDocument> {
  const existing = await HomeHighlight.findOne();
  if (existing) return existing;
  return HomeHighlight.create(DEFAULTS);
}

export async function getHomeHighlight() {
  return getOrCreateHomeHighlight();
}

export async function updateHomeHighlight(adminUserId: string, input: UpdateHomeHighlightInput) {
  const highlight = await getOrCreateHomeHighlight();
  highlight.items = input.items;
  highlight.updatedBy = adminUserId as unknown as typeof highlight.updatedBy;
  await highlight.save();

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'HOME_HIGHLIGHT_UPDATED',
    entityType: 'HomeHighlight',
    entityId: highlight.id,
    after: input,
  });

  return highlight;
}
