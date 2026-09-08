import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { emailProvider } from '../integrations/email/emailProviderFactory';
import { logger } from '../utils/logger';

/**
 * Fans out to two channels: always writes the in-app Notification; also
 * fires an email (fire-and-forget — a failed email must never fail the
 * business operation that triggered it, e.g. a webhook handler). Called
 * from services at the point of state change, never from controllers.
 */
export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  meta?: Record<string, unknown>
) {
  await Notification.create({ userId, type, title, body, meta });

  User.findById(userId)
    .then((user) => {
      if (!user) return;
      return emailProvider.send({ to: user.email, subject: title, html: `<p>${body}</p>` });
    })
    .catch((err) => {
      logger.error('Failed to send notification email', {
        userId,
        type,
        message: err instanceof Error ? err.message : String(err),
      });
    });
}

export async function listMyNotifications(userId: string) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await Notification.updateOne({ _id: notificationId, userId }, { isRead: true });
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}
