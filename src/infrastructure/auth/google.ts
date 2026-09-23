import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';

export interface VerifiedGoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string;
}

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const verifyGoogleIdToken = async (idToken: string): Promise<VerifiedGoogleIdentity> => {
  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new Error('Google identity is incomplete');
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name ?? payload.email,
    avatarUrl: payload.picture ?? ''
  };
};