import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export const FEE_STATUSES = ['Paid', 'Pending', 'Overdue'] as const;
export interface FeeRecordDoc { playerId: Types.ObjectId; planId: Types.ObjectId; amount: number; currency: string; dueDate: Date; status: (typeof FEE_STATUSES)[number]; createdAt: Date; updatedAt: Date }
const schema = new Schema<FeeRecordDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true }, planId: { type: Schema.Types.ObjectId, ref: 'FeePlan', required: true },
  amount: { type: Number, required: true, min: 0.01 }, currency: { type: String, required: true, uppercase: true, default: 'INR', minlength: 3, maxlength: 3 },
  dueDate: { type: Date, required: true }, status: { type: String, enum: FEE_STATUSES, required: true, default: 'Pending' },
}, { timestamps: true });
schema.index({ playerId: 1, dueDate: -1 });
export const FeeRecord = registerModel<FeeRecordDoc>('FeeRecord', schema);
