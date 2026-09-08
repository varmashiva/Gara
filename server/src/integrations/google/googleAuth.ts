import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  picture?: string;
}

/**
 * Verifies the ID token's signature against Google's public keys (fetched
 * and cached by the library) and checks it was issued for OUR client id —
 * this is what actually proves the token came from Google and names this
 * app, not just any Google-issued token. No client secret involved; ID
 * token verification is signature-based, unlike the OAuth code-exchange
 * flow. Google's documented, stable verification contract
 * (https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw AppError.badRequest('Google sign-in is not configured on this server', 'GOOGLE_NOT_CONFIGURED');
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  } catch {
    throw AppError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw AppError.unauthorized('Invalid Google token payload', 'INVALID_GOOGLE_TOKEN');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    firstName: payload.given_name ?? payload.name ?? 'Google',
    lastName: payload.family_name ?? 'User',
    picture: payload.picture,
  };
}
