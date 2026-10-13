import { Router } from 'express';
import mongoose from 'mongoose';
import { Attendance, Match, Player, PlayerPerformance, Team, TrainingSession } from '../models/index.js';
import { authenticate, authorizeRoles } from '../auth/middleware.js';
import { allowFields, ApiError, asyncHandler, audit, objectId, paged, sendItem, sendPage } from '../api/common.js';

export const coachApiRouter = Router();
coachApiRouter.use(authenticate, authorizeRoles('coach'));
const coachId = (res: import('express').Response) => { const id = res.locals.auth?.profileId; if (!id) throw new ApiError(403, 'Coach profile required'); return id; };
async function teamScope(res: import('express').Response, teamId: unknown) {
  const id = objectId(teamId, 'teamId');
  const team = await Team.findOne({ _id: id, coachId: coachId(res) });
  if (!team) throw new ApiError(404, 'Assigned team not found');
  return team;
}

coachApiRouter.get('/teams', asyncHandler(async (_req, res) => sendItem(res, await Team.find({ coachId: coachId(res) }))));
coachApiRouter.get('/teams/:teamId/players', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const page = await paged(Player, req, { filters: ['status'], search: ['name'], scope: { teamId: team._id } });
  return sendPage(res, page.rows.map((player) => ({ id: String(player._id), name: player.name, age: player.age, status: player.status, teamId: String(team._id) })), page.total, page.page, page.limit);
}));
for (const [path, Model, filters, search] of [
  ['sessions', TrainingSession, ['date'], ['title','venue']], ['matches', Match, ['status','date'], ['opponent','tournament','venue']],
] as const) coachApiRouter.get(`/teams/:teamId/${path}`, asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const page = await paged(Model, req, { filters, search, scope: { teamId: team._id } });
  return sendPage(res, page.rows, page.total, page.page, page.limit);
}));

coachApiRouter.post('/teams/:teamId/sessions', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const input = allowFields(req.body, ['title','date','time','venue'], ['title','date','time','venue']);
  const row = await TrainingSession.create({ ...input, teamId: team._id, coachId: coachId(res) }); await audit(res.locals.auth!.userId, 'create', 'TrainingSession', row._id); return sendItem(res, row, 201);
}));
coachApiRouter.patch('/teams/:teamId/sessions/:id', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const row = await TrainingSession.findOne({ _id: objectId(req.params.id), teamId: team._id }); if (!row) throw new ApiError(404, 'Session not found');
  Object.assign(row, allowFields(req.body, ['title','date','time','venue'])); await row.save(); await audit(res.locals.auth!.userId, 'update', 'TrainingSession', row._id); return sendItem(res, row);
}));
coachApiRouter.delete('/teams/:teamId/sessions/:id', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const row = await TrainingSession.findOne({ _id: objectId(req.params.id), teamId: team._id }); if (!row) throw new ApiError(404, 'Session not found');
  if (await Attendance.exists({ sessionId: row._id })) throw new ApiError(409, 'Session has attendance records and cannot be deleted');
  await row.deleteOne(); await audit(res.locals.auth!.userId, 'delete', 'TrainingSession', row._id); return res.status(204).end();
}));
coachApiRouter.post('/teams/:teamId/matches', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const input = allowFields(req.body, ['opponent','date','venue','tournament','ourScore','theirScore','status'], ['opponent','date','venue','tournament','status']);
  validateMatch(input); const row = await Match.create({ ...input, teamId: team._id }); await audit(res.locals.auth!.userId, 'create', 'Match', row._id); return sendItem(res, row, 201);
}));
coachApiRouter.patch('/teams/:teamId/matches/:id', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const row = await Match.findOne({ _id: objectId(req.params.id), teamId: team._id }); if (!row) throw new ApiError(404, 'Match not found');
  const input = allowFields(req.body, ['opponent','date','venue','tournament','ourScore','theirScore','status']); validateMatch({ ...row.toObject(), ...input });
  Object.assign(row, input); await row.save(); await audit(res.locals.auth!.userId, 'update', 'Match', row._id); return sendItem(res, row);
}));
coachApiRouter.delete('/teams/:teamId/matches/:id', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const row = await Match.findOne({ _id: objectId(req.params.id), teamId: team._id }); if (!row) throw new ApiError(404, 'Match not found');
  if (await PlayerPerformance.exists({ matchId: row._id })) throw new ApiError(409, 'Match has performance records and cannot be deleted');
  await row.deleteOne(); await audit(res.locals.auth!.userId, 'delete', 'Match', row._id); return res.status(204).end();
}));
coachApiRouter.get('/teams/:teamId/sessions/:sessionId/attendance', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const session = await TrainingSession.findOne({ _id: objectId(req.params.sessionId), teamId: team._id }); if (!session) throw new ApiError(404, 'Session not found');
  const [players, records] = await Promise.all([Player.find({ teamId: team._id }).select('name status'), Attendance.find({ sessionId: session._id })]); return sendItem(res, { players, attendance: records });
}));
coachApiRouter.put('/teams/:teamId/sessions/:sessionId/attendance', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const session = await TrainingSession.findOne({ _id: objectId(req.params.sessionId), teamId: team._id }); if (!session) throw new ApiError(404, 'Session not found');
  if (!Array.isArray(req.body?.records) || req.body.records.length > 200) throw new ApiError(400, 'records must be an array of at most 200 entries');
  const allowed = ['Present','Absent','Late','Excused'];
  const records: Record<string, unknown>[] = req.body.records.map((item: unknown) => allowFields(item, ['playerId','status'], ['playerId','status']));
  const ids = records.map((r) => objectId(r.playerId, 'playerId'));
  if (new Set(ids.map(String)).size !== ids.length) throw new ApiError(400, 'Every player must be a unique member of this team');
  if (records.some((r) => !allowed.includes(String(r.status)))) throw new ApiError(400, 'Invalid attendance status');
  const dbSession = await mongoose.startSession();
  let saved: Awaited<ReturnType<typeof Attendance.findOneAndUpdate>>[] = [];
  try {
    await dbSession.withTransaction(async () => {
      saved = [];
      if (await Player.countDocuments({ _id: { $in: ids }, teamId: team._id }).session(dbSession) !== ids.length) throw new ApiError(400, 'Every player must be a member of this team');
      for (const [index, record] of records.entries()) {
        const result = await Attendance.findOneAndUpdate(
          { sessionId: session._id, playerId: ids[index] },
          { $set: { status: record.status, markedAt: new Date() } },
          { upsert: true, new: true, runValidators: true, session: dbSession },
        );
        if (!result) throw new ApiError(500, 'Attendance record could not be saved');
        saved.push(result);
      }
    });
  } finally { await dbSession.endSession(); }
  await audit(res.locals.auth!.userId, 'update', 'Attendance', session._id); return sendItem(res, saved);
}));
coachApiRouter.get('/teams/:teamId/performance', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const playerIds = await Player.find({ teamId: team._id }).distinct('_id'); const page = await paged(PlayerPerformance, req, { filters: ['playerId','matchId'], search: ['notes'], scope: { playerId: { $in: playerIds } } }); return sendPage(res, page.rows, page.total, page.page, page.limit);
}));
coachApiRouter.post('/teams/:teamId/performance', asyncHandler(async (req, res) => {
  const team = await teamScope(res, req.params.teamId); const input = allowFields(req.body, ['playerId','matchId','rating','notes'], ['playerId','rating','notes']);
  const player = await Player.findOne({ _id: objectId(input.playerId, 'playerId'), teamId: team._id }); if (!player) throw new ApiError(400, 'Player must be on the assigned team');
  if (input.matchId) { const match = await Match.findOne({ _id: objectId(input.matchId, 'matchId'), teamId: team._id, status: 'Completed' }); if (!match) throw new ApiError(400, 'Match must be completed and belong to this team'); }
  const row = await PlayerPerformance.create(input); await audit(res.locals.auth!.userId, 'create', 'PlayerPerformance', row._id); return sendItem(res, row, 201);
}));

function validateMatch(input: Record<string, unknown>) {
  if (input.status !== 'Upcoming' && input.status !== 'Completed') throw new ApiError(400, 'Invalid match status');
  const hasOur = input.ourScore !== undefined && input.ourScore !== null; const hasTheir = input.theirScore !== undefined && input.theirScore !== null;
  if (input.status === 'Completed' && (!hasOur || !hasTheir)) throw new ApiError(400, 'Completed matches require both scores');
  if (input.status === 'Upcoming' && (hasOur || hasTheir)) throw new ApiError(400, 'Upcoming matches cannot have scores');
}
