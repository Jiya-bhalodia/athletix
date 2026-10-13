import { Types } from 'mongoose';
import { Payment } from '../models/index.js';

export type FeeStatus = 'Paid' | 'Pending' | 'Overdue';

export function deriveFeeStatus(amount: number, paidAmount: number, dueDate: Date | string, now = new Date()): FeeStatus {
  if (paidAmount + 0.00001 >= amount) return 'Paid';
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return new Date(dueDate).getTime() < today.getTime() ? 'Overdue' : 'Pending';
}

export async function addFeeBalances<T extends { _id: Types.ObjectId; amount: number; dueDate: Date | string; toObject?: () => Record<string, unknown> }>(fees: T[], now = new Date()) {
  if (!fees.length) return [];
  const totals = await Payment.aggregate([
    { $match: { feeRecordId: { $in: fees.map((fee) => fee._id) }, status: 'Succeeded' } },
    { $group: { _id: '$feeRecordId', total: { $sum: '$amount' } } },
  ]);
  const paidByFee = new Map(totals.map((row: { _id: Types.ObjectId; total: number }) => [String(row._id), row.total]));
  return fees.map((fee) => {
    const record = typeof fee.toObject === 'function' ? fee.toObject() : { ...fee };
    const paidAmount = paidByFee.get(String(fee._id)) ?? 0;
    return { ...record, paidAmount, pendingAmount: Math.max(0, fee.amount - paidAmount), status: deriveFeeStatus(fee.amount, paidAmount, fee.dueDate, now) };
  });
}
