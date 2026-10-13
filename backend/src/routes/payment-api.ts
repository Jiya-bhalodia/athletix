import { Router } from 'express';
import mongoose from 'mongoose';
import { FeeRecord, Payment } from '../models/index.js';
import { authenticate, authorizeParentChild, authorizeRoles } from '../auth/middleware.js';
import { allowFields, ApiError, asyncHandler, audit, objectId, sendItem } from '../api/common.js';
import { deriveFeeStatus } from '../services/fee-balances.js';

export const paymentApiRouter = Router();
paymentApiRouter.use(authenticate);
paymentApiRouter.get('/payments', authorizeRoles('admin'), asyncHandler(async (_req, res) => sendItem(res, await Payment.find().sort({ paidAt: -1 }).limit(500).populate('playerId', 'name').populate('feeRecordId', 'amount currency dueDate'))));
paymentApiRouter.get('/fees/:feeId/payments', authorizeRoles('admin'), asyncHandler(async (req, res) => sendItem(res, await Payment.find({ feeRecordId: objectId(req.params.feeId) }).sort({ paidAt: -1 }))));
paymentApiRouter.post('/fees/:feeId/payments', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const feeId = objectId(req.params.feeId); const input = allowFields(req.body, ['amount','currency','paidAt','method','reference'], ['amount','method']);
  const fee = await FeeRecord.findById(feeId); if (!fee) throw new ApiError(404, 'Fee record not found');
  const amount = Number(input.amount); if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'amount must be greater than zero');
  const session = await mongoose.startSession(); let created: unknown;
  try {
    await session.withTransaction(async () => {
      const currentFee = await FeeRecord.findById(feeId).session(session); if (!currentFee) throw new ApiError(404, 'Fee record not found');
      const paid = await Payment.aggregate([{ $match: { feeRecordId: feeId, status: 'Succeeded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]).session(session);
      if (amount + (paid[0]?.total ?? 0) > currentFee.amount + 0.00001) throw new ApiError(409, 'Payment exceeds the outstanding fee balance');
      const [payment] = await Payment.create([{ feeRecordId: feeId, playerId: currentFee.playerId, amount, currency: input.currency ?? currentFee.currency, paidAt: input.paidAt ?? new Date(), method: input.method, reference: input.reference, status: 'Succeeded' }], { session });
      const total = (paid[0]?.total ?? 0) + amount;
      currentFee.status = deriveFeeStatus(currentFee.amount, total, currentFee.dueDate);
      await currentFee.save({ session }); created = payment;
    });
  } finally { await session.endSession(); }
  await audit(res.locals.auth!.userId, 'create', 'Payment', (created as { _id: unknown })._id); return sendItem(res, created, 201);
}));
paymentApiRouter.get('/portal/player/payments', authorizeRoles('player'), asyncHandler(async (_req, res) => sendItem(res, await Payment.find({ playerId: res.locals.auth?.profileId }).sort({ paidAt: -1 }))));
paymentApiRouter.get('/portal/parent/children/:childId/payments', authorizeRoles('parent'), authorizeParentChild, asyncHandler(async (req, res) => sendItem(res, await Payment.find({ playerId: objectId(req.params.childId) }).sort({ paidAt: -1 }))));
