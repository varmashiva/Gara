import { z } from 'zod';

// Shiprocket's tracking webhook body. Only the fields we act on are
// validated; the rest (etd, scans, courier_name...) passes through and is
// stored on the ShipmentEvent as-is.
export const shiprocketWebhookSchema = z
  .object({
    awb: z.union([z.string().min(1), z.number()]),
    current_status: z.string().min(1),
    current_status_id: z.union([z.string(), z.number()]).optional(),
    current_timestamp: z.string().optional(),
    scans: z.array(z.object({ activity: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough();

export const mockShipmentCompleteSchema = z
  .object({
    status: z.enum(['picked_up', 'in_transit', 'delivered', 'failed']),
  })
  .strict();

export type ShiprocketWebhookInput = z.infer<typeof shiprocketWebhookSchema>;
