import { EmailProvider } from './EmailProvider';
import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import { env } from '../../config/env';

export const emailProvider: EmailProvider =
  env.EMAIL_PROVIDER_MODE === 'real' ? new ResendEmailProvider() : new MockEmailProvider();
