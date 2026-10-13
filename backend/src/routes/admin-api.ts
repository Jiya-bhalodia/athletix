import { Router, type RequestHandler } from 'express';
import mongoose, { type Model } from 'mongoose';
import argon2 from 'argon2';
import {
  Achievement, ActivityAudit, Announcement, Attendance, Coach, EnrollmentInquiry, FeePlan,
  FeeRecord, Match, Parent, Payment, Player, PlayerPerformance, Sport, Team, TrainingSession, User,
} from '../models/index.js';
import { authenticate, authorizeRoles } from '../auth/middleware.js';
import { allowFields, ApiError, asyncHandler, audit, filterQuery, objectId, pagination, paged, sendItem, sendPage } from '../api/common.js';
import { addFeeBalances, deriveFeeStatus } from '../services/fee-balances.js';

type ResourceConfig = { model: Model<any>; fields: readonly string[]; required: readonly string[]; filters: readonly string[]; search: readonly string[]; type: string };
const resources: Record<string, ResourceConfig> = {
  sports: { model: Sport, fields: ['name','category','description','emoji','details','active'], required: ['name','category','description'], filters: ['category','active'], search: ['name','description'], type: 'Sport' },
  coaches: { model: Coach, fields: ['name','email','phone','sportId','experience','schedule','status'], required: ['name','email','phone','sportId','experience','schedule'], filters: ['sportId','status'], search: ['name','email'], type: 'Coach' },
  teams: { model: Team, fields: ['name','sportId','coachId','ageGroup','active'], required: ['name','sportId','coachId','ageGroup'], filters: ['sportId','coachId','active'], search: ['name','ageGroup'], type: 'Team' },
  players: { model: Player, fields: ['name','email','phone','age','sportId','teamId','joinDate','emergencyName','emergencyPhone','status'], required: ['name','email','phone','age','sportId','joinDate','emergencyName','emergencyPhone'], filters: ['sportId','teamId','status'], search: ['name','email','phone'], type: 'Player' },
  parents: { model: Parent, fields: ['name','email','phone','childIds'], required: ['name','email','phone'], filters: [], search: ['name','email'], type: 'Parent' },
  sessions: { model: TrainingSession, fields: ['title','teamId','coachId','date','time','venue'], required: ['title','teamId','coachId','date','time','venue'], filters: ['teamId','coachId','date'], search: ['title','venue'], type: 'TrainingSession' },
  attendance: { model: Attendance, fields: ['sessionId','playerId','status','markedAt'], required: ['sessionId','playerId','status'], filters: ['sessionId','playerId','status'], search: [], type: 'Attendance' },
  matches: { model: Match, fields: ['teamId','opponent','date','venue','tournament','ourScore','theirScore','status'], required: ['teamId','opponent','date','venue','tournament','status'], filters: ['teamId','status','date'], search: ['opponent','tournament','venue'], type: 'Match' },
  performance: { model: PlayerPerformance, fields: ['playerId','matchId','rating','notes'], required: ['playerId','rating','notes'], filters: ['playerId','matchId'], search: ['notes'], type: 'PlayerPerformance' },
  achievements: { model: Achievement, fields: ['title','type','recipientType','playerId','teamId','sportId','date','description','featured'], required: ['title','type','recipientType','sportId','date'], filters: ['type','recipientType','playerId','teamId','sportId','featured'], search: ['title','description'], type: 'Achievement' },
  feePlans: { model: FeePlan, fields: ['name','sportId','amount','currency','frequency','active'], required: ['name','sportId','amount','frequency'], filters: ['sportId','frequency','active'], search: ['name'], type: 'FeePlan' },
  fees: { model: FeeRecord, fields: ['playerId','planId','amount','currency','dueDate'], required: ['playerId','planId','amount','dueDate'], filters: ['playerId','planId','dueDate','status'], search: [], type: 'FeeRecord' },
  announcements: { model: Announcement, fields: ['title','kind','date','body','published'], required: ['title','kind','date','body'], filters: ['kind','published','date'], search: ['title','body'], type: 'Announcement' },
  enrollmentInquiries: { model: EnrollmentInquiry, fields: ['name','email','phone','sport','message','status'], required: ['name','email','phone','sport'], filters: ['sport','status','receivedAt'], search: ['name','email','phone'], type: 'EnrollmentInquiry' },
};

export const adminApiRouter = Router();
adminApiRouter.use(authenticate, authorizeRoles('admin'));

adminApiRouter.get('/resources/:resource', asyncHandler(async (req, res) => {
  const config = getConfig(param(req.params.resource));
  if (param(req.params.resource) === 'fees') {
    const { page, limit, skip } = pagination(req);
    const { filter } = filterQuery(req, config.filters);
    const requestedStatus = filter.status;
    delete filter.status;
    if (requestedStatus && !['Paid', 'Pending', 'Overdue'].includes(String(requestedStatus))) throw new ApiError(400, 'Invalid fee status filter');
    const dueDate = filter.dueDate;
    if (typeof dueDate === 'string') {
      const day = new Date(`${dueDate}T00:00:00.000Z`);
      if (Number.isNaN(day.getTime())) throw new ApiError(400, 'Invalid dueDate filter');
      const nextDay = new Date(day); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter.dueDate = { $gte: day, $lt: nextDay };
    }
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const balanceStages = [
      { $lookup: { from: Payment.collection.name, localField: '_id', foreignField: 'feeRecordId', as: 'payments' } },
      { $addFields: { paidAmount: { $sum: { $map: { input: { $filter: { input: '$payments', as: 'payment', cond: { $eq: ['$$payment.status', 'Succeeded'] } } }, as: 'payment', in: '$$payment.amount' } } } } },
      { $addFields: { pendingAmount: { $max: [0, { $subtract: ['$amount', '$paidAmount'] }] } } },
      { $addFields: { status: { $switch: { branches: [
        { case: { $gte: ['$paidAmount', '$amount'] }, then: 'Paid' },
        { case: { $lt: ['$dueDate', today] }, then: 'Overdue' },
      ], default: 'Pending' } } } },
      { $project: { payments: 0 } },
    ];
    const matchStatus = requestedStatus ? [{ $match: { status: requestedStatus } }] : [];
    const beforeStatusMatch = [...balanceStages.slice(0, 3), balanceStages[3]!];
    const [rows, count] = await Promise.all([
      FeeRecord.aggregate([...beforeStatusMatch, ...matchStatus, balanceStages[4]!, { $sort: { createdAt: -1, _id: 1 } }, { $skip: skip }, { $limit: limit }]),
      FeeRecord.aggregate([...beforeStatusMatch, ...matchStatus, { $count: 'total' }]),
    ]);
    return sendPage(res, rows, count[0]?.total ?? 0, page, limit);
  }
  const page = await paged(config.model, req, { filters: config.filters, search: config.search });
  return sendPage(res, page.rows, page.total, page.page, page.limit);
}));

adminApiRouter.post('/resources/:resource', asyncHandler(async (req, res) => {
  const resource = param(req.params.resource); const config = getConfig(resource);
  if (resource === 'fees') {
    const input = allowFields(req.body, [...config.fields, 'paidAmount', 'paidAt', 'method'], config.required);
    const amount = Number(input.amount);
    const paidAmount = input.paidAmount === undefined ? 0 : Number(input.paidAmount);
    if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > amount) throw new ApiError(400, 'Paid amount must be between zero and the fee amount');
    if (paidAmount > 0 && (!input.paidAt || !input.method)) throw new ApiError(400, 'Payment date and method are required when adding a paid amount');
    const paidAt = input.paidAt ? new Date(String(input.paidAt)) : undefined;
    if (paidAt && Number.isNaN(paidAt.getTime())) throw new ApiError(400, 'Payment date is invalid');
    const feeData = normalizeInput(resource, Object.fromEntries(Object.entries(input).filter(([key]) => config.fields.includes(key))));
    await validateRelationships(resource, feeData);
    const createdFee = await FeeRecord.create({ ...feeData, status: deriveFeeStatus(amount, 0, String(input.dueDate)) });
    try {
      if (paidAmount > 0) {
        await Payment.create({
          feeRecordId: createdFee._id, playerId: createdFee.playerId, amount: paidAmount, paidAt,
          method: input.method, status: 'Succeeded', currency: createdFee.currency,
        });
      }
    } catch (error) {
      await createdFee.deleteOne();
      throw error;
    }
    await audit(res.locals.auth!.userId, 'create', config.type, createdFee._id);
    const [created] = await addFeeBalances([createdFee]);
    return sendItem(res, created, 201);
  }
  const accountResource = resource === 'players' || resource === 'parents';
  const input = allowFields(req.body, accountResource ? [...config.fields, 'loginPassword'] : config.fields,
    accountResource ? [...config.required, 'loginPassword'] : config.required);
  const loginPassword = input.loginPassword;
  if (accountResource && (typeof loginPassword !== 'string' || loginPassword.length < 12 || loginPassword.length > 128)) throw new ApiError(400, 'Initial login password must be between 12 and 128 characters');
  const profileInput = Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'loginPassword'));
  const data = normalizeInput(resource, profileInput);
  await validateRelationships(resource, data);
  const row = await config.model.create(data);
  if (accountResource) {
    const role = resource === 'players' ? 'player' : 'parent';
    let accountId: mongoose.Types.ObjectId | undefined;
    try {
      if (await User.exists({ email: data.email })) throw new ApiError(409, 'An account with this email already exists');
      const passwordHash = await argon2.hash(loginPassword as string, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
      const link = resource === 'players' ? { playerId: row._id } : { parentId: row._id };
      const account = await User.create({ email: data.email, role, status: 'active', passwordHash, ...link });
      accountId = account._id;
      row.userId = account._id;
      await row.save();
    } catch (error) {
      if (accountId) await User.deleteOne({ _id: accountId });
      await row.deleteOne();
      throw error;
    }
  }
  await audit(res.locals.auth!.userId, 'create', config.type, row._id);
  return sendItem(res, row, 201);
}));

adminApiRouter.post('/resources/:resource/:id/account', asyncHandler(async (req, res) => {
  const resource = param(req.params.resource);
  if (resource !== 'players' && resource !== 'parents') throw new ApiError(404, 'Login accounts are only supported for player and parent profiles');
  const { loginPassword } = allowFields(req.body, ['loginPassword'], ['loginPassword']);
  if (typeof loginPassword !== 'string' || loginPassword.length < 12 || loginPassword.length > 128) throw new ApiError(400, 'Initial login password must be between 12 and 128 characters');
  const id = objectId(param(req.params.id));
  const Profile: Model<any> = resource === 'players' ? Player : Parent;
  const profile = await Profile.findById(id);
  if (!profile) throw new ApiError(404, 'Profile not found');
  const role = resource === 'players' ? 'player' : 'parent';
  const passwordHash = await argon2.hash(loginPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const link = resource === 'players' ? { playerId: profile._id } : { parentId: profile._id };
  if (profile.userId) {
    const user = await User.findOne({ _id: profile.userId, role, ...link });
    if (!user) throw new ApiError(409, 'The profile login link is invalid. Contact technical support.');
    user.passwordHash = passwordHash;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
    await audit(res.locals.auth!.userId, 'reset-password', resource === 'players' ? 'Player' : 'Parent', id);
    return res.json({ data: { linked: true, passwordReset: true } });
  }
  if (await User.exists({ email: profile.email })) throw new ApiError(409, 'An account with this email already exists');
  const account = await User.create({ email: profile.email, role, status: 'active', passwordHash, ...link });
  try {
    profile.userId = account._id;
    await profile.save();
  } catch (error) {
    await User.deleteOne({ _id: account._id });
    throw error;
  }
  await audit(res.locals.auth!.userId, 'provision-login', resource === 'players' ? 'Player' : 'Parent', id);
  return res.status(201).json({ data: { linked: true } });
}));

adminApiRouter.get('/resources/:resource/:id', asyncHandler(async (req, res) => {
  const config = getConfig(param(req.params.resource)); const row = await config.model.findById(objectId(param(req.params.id)));
  if (!row) throw new ApiError(404, 'Record not found');
  return sendItem(res, row);
}));

adminApiRouter.patch('/resources/:resource/:id', asyncHandler(async (req, res) => {
  const resource = param(req.params.resource); const config = getConfig(resource); const id = objectId(param(req.params.id));
  const row = await config.model.findById(id); if (!row) throw new ApiError(404, 'Record not found');
  const data = normalizeInput(resource, allowFields(req.body, config.fields));
  if (!Object.keys(data).length) throw new ApiError(400, 'Provide at least one field to update');
  const merged = { ...row.toObject(), ...data };
  await validateRelationships(resource, merged, id);
  if ((resource === 'players' || resource === 'parents') && typeof data.email === 'string' && row.userId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const linkedUser = await User.findOne({ _id: row.userId, role: resource === 'players' ? 'player' : 'parent', ...(resource === 'players' ? { playerId: row._id } : { parentId: row._id }) }).session(session);
        if (!linkedUser) throw new ApiError(409, 'The profile login link is invalid. Contact technical support.');
        if (await User.exists({ email: data.email, _id: { $ne: row.userId } }).session(session)) throw new ApiError(409, 'An account with this email already exists');
        const transactionalRow = await config.model.findById(id).session(session);
        if (!transactionalRow) throw new ApiError(404, 'Record not found');
        Object.assign(transactionalRow, data);
        linkedUser.email = String(data.email).trim().toLowerCase();
        await linkedUser.save({ session });
        await transactionalRow.save({ session, validateModifiedOnly: false });
      });
    } finally { await session.endSession(); }
  } else {
    Object.assign(row, data); await row.save({ validateModifiedOnly: false });
  }
  await audit(res.locals.auth!.userId, 'update', config.type, row._id);
  return sendItem(res, row);
}));

adminApiRouter.delete('/resources/:resource/:id', asyncHandler(async (req, res) => {
  const resource = param(req.params.resource); const config = getConfig(resource); const id = objectId(param(req.params.id));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const row = await config.model.findById(id).session(session); if (!row) throw new ApiError(404, 'Record not found');
      await ensureDeletable(resource, id, session);
      if (['players', 'parents', 'coaches'].includes(resource) && row.userId) {
        const role = resource === 'players' ? 'player' : resource === 'parents' ? 'parent' : 'coach';
        const link = resource === 'players' ? { playerId: id } : resource === 'parents' ? { parentId: id } : { coachId: id };
        const linkedUser = await User.findOne({ _id: row.userId, role, ...link }).session(session);
        if (!linkedUser) throw new ApiError(409, 'The profile login link is invalid. Contact technical support.');
        await linkedUser.deleteOne({ session });
      }
      await row.deleteOne({ session });
    });
  } finally { await session.endSession(); }
  await audit(res.locals.auth!.userId, 'delete', config.type, id);
  return res.status(204).end();
}));

adminApiRouter.get('/activity', asyncHandler(async (req, res) => {
  const pageSize = Math.min(Number(req.query.limit) || 10, 100);
  if (pageSize < 1) throw new ApiError(400, 'Invalid limit');
  const rows = await ActivityAudit.find().sort({ occurredAt: -1 }).limit(pageSize).select('action entityType occurredAt');
  return sendItem(res, rows.map((row) => ({ id: String(row._id), text: `${row.action} ${row.entityType}`, at: row.occurredAt.toISOString() })));
}));

function getConfig(name: string): ResourceConfig {
  const config = resources[name]; if (!config) throw new ApiError(404, 'Unknown resource'); return config;
}
function param(value: string | string[] | undefined): string { return typeof value === 'string' ? value : ''; }

function normalizeInput(resource: string, input: Record<string, unknown>) {
  const data = { ...input };
  for (const key of ['sportId','coachId','teamId','playerId','sessionId','matchId','planId','feeRecordId','parentId']) {
    if (data[key] === '') { if (key === 'teamId' && resource === 'players') data[key] = undefined; else throw new ApiError(400, `${key} cannot be empty`); }
  }
  if (resource === 'achievements') {
    if (data.featured === 'Yes') data.featured = true; if (data.featured === 'No') data.featured = false;
    if (typeof data.recipient === 'string') throw new ApiError(400, 'Use recipientType with playerId or teamId');
  }
  if (resource === 'announcements' && (data.published === 'Yes' || data.published === 'No')) data.published = data.published === 'Yes';
  if (resource === 'sports' || resource === 'teams' || resource === 'feePlans') if (data.active === 'Yes' || data.active === 'No') data.active = data.active === 'Yes';
  return data;
}

async function validateRelationships(resource: string, data: Record<string, unknown>, selfId?: mongoose.Types.ObjectId) {
  const exists = async (Model: Model<any>, id: unknown) => Boolean(id && await Model.exists({ _id: id }));
  if (resource === 'coaches' && !await exists(Sport, data.sportId)) throw new ApiError(400, 'Sport does not exist');
  if (resource === 'teams') {
    const [sport, coach] = await Promise.all([Sport.findById(data.sportId), Coach.findById(data.coachId)]);
    if (!sport || !coach) throw new ApiError(400, 'Team sport and coach must exist');
    if (String(coach.sportId) !== String(data.sportId)) throw new ApiError(400, 'Coach must be assigned to the team sport');
    if (selfId && await Player.exists({ teamId: selfId, sportId: { $ne: data.sportId } })) throw new ApiError(409, 'Cannot change team sport while assigned players use another sport');
  }
  if (resource === 'players') {
    if (!await exists(Sport, data.sportId)) throw new ApiError(400, 'Sport does not exist');
    if (data.teamId && data.teamId !== null) {
      const team = await Team.findById(data.teamId);
      if (!team || String(team.sportId) !== String(data.sportId)) throw new ApiError(400, 'Player team must belong to the selected sport');
    }
  }
  if (resource === 'sessions') {
    const team = await Team.findById(data.teamId); const coach = await Coach.findById(data.coachId);
    if (!team || !coach || String(team.coachId) !== String(data.coachId) || String(coach.sportId) !== String(team.sportId)) throw new ApiError(400, 'Session coach must coach the selected team');
  }
  if (resource === 'attendance') {
    const [session, player] = await Promise.all([TrainingSession.findById(data.sessionId), Player.findById(data.playerId)]);
    if (!session || !player || String(session.teamId) !== String(player.teamId)) throw new ApiError(400, 'Attendance player must belong to the session team');
  }
  if (resource === 'matches' && !await exists(Team, data.teamId)) throw new ApiError(400, 'Team does not exist');
  if (resource === 'performance') {
    const [player, match] = await Promise.all([Player.findById(data.playerId), data.matchId ? Match.findById(data.matchId) : null]);
    if (!player || (data.matchId && (!match || String(match.teamId) !== String(player.teamId) || match.status !== 'Completed'))) throw new ApiError(400, 'Performance must reference a completed match for the player team');
  }
  if (resource === 'achievements') {
    const player = data.recipientType === 'player' && data.playerId ? await Player.findById(data.playerId) : null;
    const team = data.recipientType === 'team' && data.teamId ? await Team.findById(data.teamId) : null;
    if ((data.recipientType === 'player' && !player) || (data.recipientType === 'team' && !team) || !['player','team'].includes(String(data.recipientType))) throw new ApiError(400, 'Achievement recipient must be an existing player or team');
    const expectedSport = player?.sportId ?? team?.sportId;
    if (!expectedSport || String(expectedSport) !== String(data.sportId) || !await exists(Sport, data.sportId)) throw new ApiError(400, 'Achievement sport must match its recipient');
  }
  if (resource === 'feePlans' && !await exists(Sport, data.sportId)) throw new ApiError(400, 'Sport does not exist');
  if (resource === 'fees') {
    const [player, plan] = await Promise.all([Player.findById(data.playerId), FeePlan.findById(data.planId)]);
    if (!player || !plan || String(player.sportId) !== String(plan.sportId)) throw new ApiError(400, 'Fee plan must match the player sport');
  }
  if (resource === 'parents' && Array.isArray(data.childIds)) {
    if (data.childIds.some((id) => !mongoose.isValidObjectId(id))) throw new ApiError(400, 'Every child reference must be a valid player ID');
    const count = await Player.countDocuments({ _id: { $in: data.childIds } });
    if (count !== data.childIds.length) throw new ApiError(400, 'Every linked child must exist');
  }
  if (resource === 'announcements' && data.published !== undefined && typeof data.published !== 'boolean') throw new ApiError(400, 'published must be a boolean');
}

async function ensureDeletable(resource: string, id: mongoose.Types.ObjectId, session: mongoose.ClientSession) {
  const referenceChecks: Record<string, Array<[Model<any>, string]>> = {
    sports: [[Coach, 'sportId'],[Team,'sportId'],[Player,'sportId'],[Achievement,'sportId'],[FeePlan,'sportId']],
    coaches: [[Team,'coachId'],[TrainingSession,'coachId']], teams: [[Player,'teamId'],[TrainingSession,'teamId'],[Match,'teamId'],[Achievement,'teamId']],
    players: [[Attendance,'playerId'],[PlayerPerformance,'playerId'],[Achievement,'playerId'],[FeeRecord,'playerId'],[Parent,'childIds']],
    sessions: [[Attendance,'sessionId']], matches: [[PlayerPerformance,'matchId']], feePlans: [[FeeRecord,'planId']], fees: [[Payment,'feeRecordId']],
  };
  for (const [Model, field] of referenceChecks[resource] ?? []) if (await Model.exists({ [field]: id }).session(session)) throw new ApiError(409, 'Record is referenced by other data; archive it instead of deleting');
}
