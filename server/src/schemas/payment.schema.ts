import { z } from 'zod';

export const createPaymentOrderSchema = z
  .object({
    orderId: z.string().min(1),
  })
  .strict();

export const webhookSchema = z
  .object({
    eventId: z.string().min(1),
    providerOrderId: z.string().min(1),
    providerPaymentId: z.string().min(1),
    status: z.enum(['captured', 'failed']),
    signature: z.string().min(1),
  })
  .strict();

export const mockCompleteSchema = z
  .object({
    status: z.enum(['captured', 'failed']).default('captured'),
  })
  .strict();

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
export type MockCompleteInput = z.infer<typeof mockCompleteSchema>;
