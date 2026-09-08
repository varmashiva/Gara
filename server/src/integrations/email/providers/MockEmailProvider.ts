import { EmailProvider, SendEmailParams } from '../EmailProvider';
import { logger } from '../../../utils/logger';

/** Local-dev/test provider — logs instead of sending, no credentials needed. */
export class MockEmailProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<void> {
    logger.info('Mock email send', { to: params.to, subject: params.subject });
  }
}
