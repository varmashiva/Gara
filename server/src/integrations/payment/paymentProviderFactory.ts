// Deliberately NOT named paymentProvider.ts (matching case-only difference
// from PaymentProvider.ts above) — macOS/Windows default filesystems are
// case-insensitive and would silently collapse the two into one file.
import { PaymentProvider } from './PaymentProvider';
import { MockPaymentProvider } from './providers/MockPaymentProvider';
import { RazorpayPaymentProvider } from './providers/RazorpayPaymentProvider';
import { env } from '../../config/env';

export const paymentProvider: PaymentProvider =
  env.PAYMENT_PROVIDER_MODE === 'real' ? new RazorpayPaymentProvider() : new MockPaymentProvider();
