import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

const DEV_ADMIN_EMAIL = 'admin@example.com';
const DEV_ADMIN_PASSWORD = 'DevAdmin123!';

/**
 * Development-only convenience: without this there is no way to reach any
 * /api/v1/admin/* route on a fresh database, since ADMIN is never a
 * self-assignable registration role. Real seed data (Section 51/52 of the
 * design doc) is a later phase — this only bootstraps the one account
 * needed to test admin flows locally.
 */
export async function seedDevAdmin() {
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) return;

  const passwordHash = await hashPassword(DEV_ADMIN_PASSWORD);
  await User.create({
    username: 'admin',
    email: DEV_ADMIN_EMAIL,
    passwordHash,
    role: 'ADMIN',
    firstName: 'Dev',
    lastName: 'Admin',
    isEmailVerified: true,
  });

  logger.info('Seeded development-only admin account', {
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
    note: 'development only — never used in production',
  });
}
