import { Schema, model, Document, Types } from 'mongoose';

export interface SessionDocument extends Document {
  userId: Types.ObjectId;
  jti: string;
  revokedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jti: { type: String, required: true, unique: true },
  revokedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Session = model<SessionDocument>('Session', sessionSchema);
