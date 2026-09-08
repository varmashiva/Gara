import { User, UserDocument } from '../models/User';
import { Session } from '../models/Session';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { verifyGoogleIdToken } from '../integrations/google/googleAuth';
import { slugify } from '../utils/slugify';
import { AppError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function toPublicUser(user: UserDocument) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
  };
}

async function issueTokens(user: UserDocument) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken, jti } = signRefreshToken(user.id);

  await Session.create({
    userId: user._id,
    jti,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({
    $or: [{ email: input.email }, { username: input.username }],
  });
  if (existing) {
    throw AppError.conflict('Email or username already in use', 'USER_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    username: input.username,
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'CUSTOMER',
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email, isDeleted: false }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status === 'SUSPENDED') {
    throw AppError.forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

async function generateUniqueUsername(email: string): Promise<string> {
  const base = slugify(email.split('@')[0]) || 'user';
  let username = base;
  let attempt = 0;
  while (await User.exists({ username })) {
    attempt += 1;
    username = `${base}${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break;
  }
  return username;
}

/**
 * Handles all three cases from the design doc's Google auth flow:
 * existing Google account -> log in; existing local account with the same
 * email -> link (only when Google itself has verified that email, which is
 * what email_verified on the ID token attests — no separate confirmation
 * step needed since Google is already vouching for ownership); neither ->
 * create a new account. Never creates a duplicate user for one person.
 */
export async function loginWithGoogle(idToken: string) {
  const profile = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ googleId: profile.googleId, isDeleted: false });

  if (!user) {
    const existingByEmail = await User.findOne({ email: profile.email, isDeleted: false });

    if (existingByEmail) {
      if (!profile.emailVerified) {
        throw AppError.conflict(
          'An account with this email already exists. Please sign in with your password instead.',
          'EMAIL_NOT_VERIFIED_FOR_LINKING'
        );
      }
      existingByEmail.googleId = profile.googleId;
      await existingByEmail.save();
      user = existingByEmail;
    } else {
      const username = await generateUniqueUsername(profile.email);
      user = await User.create({
        username,
        email: profile.email,
        googleId: profile.googleId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.picture,
        isEmailVerified: profile.emailVerified,
        role: 'CUSTOMER',
      });
    }
  }

  if (user.status === 'SUSPENDED') {
    throw AppError.forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const session = await Session.findOne({ jti: payload.jti });

  if (!session || session.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh session not found or expired', 'INVALID_REFRESH_TOKEN');
  }

  if (session.revokedAt) {
    // Reuse of an already-rotated refresh token: treat as compromise, revoke the whole family.
    await Session.updateMany({ userId: session.userId, revokedAt: null }, { revokedAt: new Date() });
    throw AppError.unauthorized('Refresh token reuse detected, all sessions revoked', 'REFRESH_REUSE_DETECTED');
  }

  const user = await User.findById(session.userId);
  if (!user || user.isDeleted) {
    throw AppError.unauthorized('User not found', 'INVALID_REFRESH_TOKEN');
  }

  session.revokedAt = new Date();
  await session.save();

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await Session.updateOne({ jti: payload.jti }, { revokedAt: new Date() });
  } catch {
    // Already invalid/expired — nothing to revoke.
  }
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }
  return toPublicUser(user);
}
