import { EmailProvider, SendEmailParams } from '../EmailProvider';
import { env } from '../../../config/env';

/**
 * Resend's API (https://resend.com/docs/api-reference/emails/send-email) —
 * a single documented, stable POST /emails endpoint with Bearer auth. Not
 * exercised against the live API this session (no credentials available
 * here), only implemented to the documented shape.
 */
export class ResendEmailProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      // Never include the API key in this error — it's not in the request
      // body/response, only the Authorization header, so this is safe.
      throw new Error(`Email send failed: ${response.status} ${await response.text()}`);
    }
  }
}
