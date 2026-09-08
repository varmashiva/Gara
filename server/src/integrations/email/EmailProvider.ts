export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Business logic depends on this interface, never on a specific vendor SDK
 * (Rule 20). Never log the API key or full email body at info level — see
 * MockEmailProvider for what's safe to log.
 */
export interface EmailProvider {
  send(params: SendEmailParams): Promise<void>;
}
