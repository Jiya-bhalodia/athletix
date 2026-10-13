import { Router } from 'express';
import mongoose from 'mongoose';
import { Achievement, Attendance, FeeRecord, Match, Parent, Payment, Player, PlayerPerformance, TrainingSession, User } from '../models/index.js';
import { authenticate, authorizeParentChild, authorizeRoles } from '../auth/middleware.js';
import { allowFields, ApiError, asyncHandler, objectId, sendItem } from '../api/common.js';
import { addFeeBalances } from '../services/fee-balances.js';

export const portalApiRouter = Router();
portalApiRouter.use(authenticate);
portalApiRouter.get('/player', authorizeRoles('player'), asyncHandler(async (_req, res) => {
  const id = res.locals.auth?.profileId; const player = await Player.findById(id); if (!player) throw new ApiError(404, 'Player profile not found');
  return sendItem(res, await playerSnapshot(player._id));
}));
portalApiRouter.patch('/player/profile', authorizeRoles('player'), asyncHandler(async (req, res) => {
  const player = await Player.findById(res.locals.auth?.profileId); if (!player) throw new ApiError(404, 'Player profile not found');
  const changes = allowFields(req.body, ['email','phone','emergencyName','emergencyPhone']);
  if (typeof changes.email !== 'string' || changes.email.trim().toLowerCase() === player.email) {
    Object.assign(player, changes); await player.save(); return sendItem(res, player);
  }
  const normalizedEmail = changes.email.trim().toLowerCase();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const transactionalPlayer = await Player.findById(player._id).session(session);
      if (!transactionalPlayer?.userId) throw new ApiError(409, 'Player login link is missing. Contact the academy administrator.');
      if (await User.exists({ email: normalizedEmail, _id: { $ne: transactionalPlayer.userId } }).session(session)) throw new ApiError(409, 'An account with this email already exists');
      const user = await User.findOne({ _id: transactionalPlayer.userId, role: 'player', playerId: transactionalPlayer._id }).session(session);
      if (!user) throw new ApiError(409, 'Player login link is invalid. Contact the academy administrator.');
      Object.assign(transactionalPlayer, changes);
      transactionalPlayer.email = normalizedEmail;
      user.email = normalizedEmail;
      await transactionalPlayer.save({ session });
      await user.save({ session });
    });
  } finally { await session.endSession(); }
  const updated = await Player.findById(player._id);
  if (!updated) throw new ApiError(404, 'Player profile not found');
  return sendItem(res, updated);
}));
portalApiRouter.get('/parent/children', authorizeRoles('parent'), asyncHandler(async (_req, res) => {
  const parent = await Parent.findOne({ _id: res.locals.auth?.profileId, userId: res.locals.auth?.userId }).populate('childIds', 'name sportId teamId status');
  if (!parent) throw new ApiError(404, 'Parent profile not found'); return sendItem(res, parent.childIds);
}));
portalApiRouter.get('/parent/children/:childId', authorizeRoles('parent'), authorizeParentChild, asyncHandler(async (req, res) => {
  const player = await Player.findById(objectId(req.params.childId, 'childId')); if (!player) throw new ApiError(404, 'Player profile not found');
  return sendItem(res, await playerSnapshot(player._id));
}));

async function playerSnapshot(playerId: import('mongoose').Types.ObjectId) {
  const basePlayer = await Player.findById(playerId);
  if (!basePlayer) throw new ApiError(404, 'Player profile not found');
  const [player, sessions, attendance, matches, performance, achievements, fees, payments] = await Promise.all([
    Player.findById(playerId).populate('sportId', 'name').populate({ path: 'teamId', select: 'name ageGroup coachId', populate: { path: 'coachId', select: 'name' } }),
    basePlayer.teamId ? TrainingSession.find({ teamId: basePlayer.teamId }).sort({ date: -1 }).limit(50) : Promise.resolve([]),
    Attendance.find({ playerId }).sort({ markedAt: -1 }).limit(100),
    basePlayer.teamId ? Match.find({ teamId: basePlayer.teamId }).sort({ date: -1 }).limit(50) : Promise.resolve([]),
    PlayerPerformance.find({ playerId }).sort({ createdAt: -1 }).limit(100),
    Achievement.find({ $or: [{ playerId }, ...(basePlayer.teamId ? [{ teamId: basePlayer.teamId }] : [])] }).sort({ date: -1 }).limit(100).populate('sportId', 'name').populate('playerId', 'name').populate('teamId', 'name'),
    FeeRecord.find({ playerId }).sort({ dueDate: -1 }).limit(100).populate('planId', 'name frequency'),
    Payment.find({ playerId }).sort({ paidAt: -1 }).limit(100),
  ]);
  return { player, sessions, attendance, matches, performance, achievements, fees: await addFeeBalances(fees), payments };
}
