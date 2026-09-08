import { Schema, model, Document, Types } from 'mongoose';

export interface AuditLogDocument extends Document {
  actorId?: Types.ObjectId;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

// Append-only by convention: no route in this app ever updates or deletes
// an AuditLog document, and it's deliberately excluded from every model's
// soft-delete pattern — audit/financial records stay permanently traceable
// (design doc §11).
export const AuditLog = model<AuditLogDocument>('AuditLog', auditLogSchema);
