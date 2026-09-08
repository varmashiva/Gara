import { User } from '../models/User';
import { Session } from '../models/Session';
import { AppError } from '../utils/errors';
import { recordAudit } from './audit.service';

export async function listUsers(search?: string) {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ];
  }
  return User.find(filter).select('username email role status createdAt').sort({ createdAt: -1 }).limit(100);
}

/**
 * Suspending a user must take effect immediately, not just block future
 * logins — anyone already holding a valid session (access token still
 * live for up to 15 min, or a refresh token) gets every session revoked
 * right now, matching the "server-side revocation strategy" a suspension
 * control is supposed to provide. The access token itself can't be
 * invalidated early (it's a stateless JWT), but /refresh will reject it
 * the moment it's used again, and the design accepts a max ~15 min tail.
 */
export async function setUserStatus(
  adminUserId: string,
  targetUserId: string,
  status: 'ACTIVE' | 'SUSPENDED'
) {
  const user = await User.findOne({ _id: targetUserId, isDeleted: false });
  if (!user) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }
  if (user.role === 'ADMIN') {
    throw AppError.forbidden('Admin accounts cannot be suspended through this endpoint', 'CANNOT_SUSPEND_ADMIN');
  }

  const before = user.status;
  user.status = status;
  await user.save();

  if (status === 'SUSPENDED') {
    await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  }

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    entityType: 'User',
    entityId: user.id,
    before: { status: before },
    after: { status },
  });

  return { id: user.id, status: user.status };
}
