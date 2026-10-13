import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank transfer', 'Other'] as const;
export interface PaymentDoc { feeRecordId: Types.ObjectId; playerId: Types.ObjectId; amount: number; currency: string; paidAt: Date; method: (typeof PAYMENT_METHODS)[number]; status: 'Succeeded' | 'Pending' | 'Failed' | 'Refunded'; reference?: string; createdAt: Date; updatedAt: Date }
const schema = new Schema<PaymentDoc>({
  feeRecordId: { type: Schema.Types.ObjectId, ref: 'FeeRecord', required: true }, playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  amount: { type: Number, required: true, min: 0.01 }, currency: { type: String, required: true, uppercase: true, default: 'INR', minlength: 3, maxlength: 3 },
  paidAt: { type: Date, required: true }, method: { type: String, enum: PAYMENT_METHODS, required: true },
  status: { type: String, enum: ['Succeeded', 'Pending', 'Failed', 'Refunded'], default: 'Succeeded', required: true },
  reference: { type: String, trim: true, maxlength: 160 },
}, { timestamps: true });
schema.index({ feeRecordId: 1, paidAt: -1 }); schema.index({ playerId: 1, paidAt: -1 });
export const Payment = registerModel<PaymentDoc>('Payment', schema);
