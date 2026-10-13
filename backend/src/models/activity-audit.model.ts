import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export const AUDIT_ENTITY_TYPES = ['User', 'Sport', 'Coach', 'Team', 'Player', 'Parent', 'TrainingSession', 'Attendance', 'Match', 'PlayerPerformance', 'Achievement', 'FeePlan', 'FeeRecord', 'Payment', 'Announcement', 'EnrollmentInquiry'] as const;
export type SafeAuditValue = string | number | boolean | null;
export interface ActivityAuditDoc { actorId: Types.ObjectId; action: string; entityType: (typeof AUDIT_ENTITY_TYPES)[number]; entityId: Types.ObjectId; occurredAt: Date; metadata: Map<string, SafeAuditValue>; createdAt: Date; updatedAt: Date }
const schema = new Schema<ActivityAuditDoc>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, required: true, trim: true, maxlength: 100 },
  entityType: { type: String, enum: AUDIT_ENTITY_TYPES, required: true }, entityId: { type: Schema.Types.ObjectId, required: true },
  occurredAt: { type: Date, default: Date.now, required: true }, metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
schema.pre('validate', function () {
  const unsafeKey = [...(this.metadata?.keys() ?? [])].find((key) => /password|token|secret|authorization|cookie/i.test(key));
  if (unsafeKey) this.invalidate('metadata', 'Audit metadata cannot contain secret-related keys.');
  for (const value of this.metadata?.values() ?? []) {
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) this.invalidate('metadata', 'Audit metadata values must be scalar and safe.');
  }
});
schema.index({ entityType: 1, entityId: 1, occurredAt: -1 }); schema.index({ actorId: 1, occurredAt: -1 });
export const ActivityAudit = registerModel<ActivityAuditDoc>('ActivityAudit', schema);
