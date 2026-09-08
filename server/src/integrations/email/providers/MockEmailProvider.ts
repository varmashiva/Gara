import { EmailProvider, SendEmailParams } from '../EmailProvider';
import { logger } from '../../../utils/logger';

/**
 * Local-dev/test provider — logs instead of sending, no credentials needed.
 * Includes the body so links (password reset, etc.) are actually usable
 * locally without a real inbox — the standard "log magic links to the
 * console in dev" pattern.
 */
export class MockEmailProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<void> {
    logger.info('Mock email send', { to: params.to, subject: params.subject, html: params.html });
  }
}
