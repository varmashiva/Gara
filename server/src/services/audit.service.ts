import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export interface AuditEntry {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

/**
 * Fire-and-forget by design — an audit write failing must never fail (or
 * even slow down, beyond the write itself) the business operation it's
 * recording. Never pass password hashes, tokens, or payment/webhook
 * secrets in `before`/`after`; callers are responsible for only including
 * fields safe to retain indefinitely in an append-only log.
 */
export function recordAudit(entry: AuditEntry): void {
  AuditLog.create(entry).catch((err) => {
    logger.error('Failed to write audit log entry', {
      action: entry.action,
      entityType: entry.entityType,
      message: err instanceof Error ? err.message : String(err),
    });
  });
}
