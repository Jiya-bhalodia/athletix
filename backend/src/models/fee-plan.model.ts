import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export const FEE_FREQUENCIES = ['Monthly', 'Quarterly', 'Annual'] as const;
export interface FeePlanDoc { name: string; sportId: Types.ObjectId; amount: number; currency: string; frequency: (typeof FEE_FREQUENCIES)[number]; active: boolean; createdAt: Date; updatedAt: Date }
const schema = new Schema<FeePlanDoc>({
  name: { type: String, required: true, trim: true, maxlength: 120 }, sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  amount: { type: Number, required: true, min: 0.01 }, currency: { type: String, required: true, uppercase: true, default: 'INR', minlength: 3, maxlength: 3 },
  frequency: { type: String, enum: FEE_FREQUENCIES, required: true }, active: { type: Boolean, default: true, required: true },
}, { timestamps: true });
schema.index({ sportId: 1, active: 1 });
export const FeePlan = registerModel<FeePlanDoc>('FeePlan', schema);
