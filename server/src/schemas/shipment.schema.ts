import { z } from 'zod';

export const shipmentWebhookSchema = z
  .object({
    eventId: z.string().min(1),
    externalShipmentId: z.string().min(1),
    status: z.enum(['picked_up', 'in_transit', 'delivered', 'failed']),
    description: z.string().optional(),
    signature: z.string().min(1),
  })
  .strict();

export const mockShipmentCompleteSchema = z
  .object({
    status: z.enum(['picked_up', 'in_transit', 'delivered', 'failed']),
  })
  .strict();

export type ShipmentWebhookInput = z.infer<typeof shipmentWebhookSchema>;
