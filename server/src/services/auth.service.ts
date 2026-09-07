import { User, UserDocument } from '../models/User';
import { Session } from '../models/Session';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
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
