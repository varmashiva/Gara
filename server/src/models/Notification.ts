import { Schema, model, Document, Types } from 'mongoose';

export interface NotificationDocument extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<NotificationDocument>('Notification', notificationSchema);
