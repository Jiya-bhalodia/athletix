import { Router } from 'express';
import { Attendance, Coach, FeeRecord, Match, Player, Sport, Team, TrainingSession } from '../models/index.js';
import { authenticate, authorizeRoles } from '../auth/middleware.js';
import { asyncHandler, sendItem } from '../api/common.js';
import { addFeeBalances } from '../services/fee-balances.js';

export const reportApiRouter = Router();
reportApiRouter.use(authenticate, authorizeRoles('admin'));
reportApiRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const [sports, coaches, teams, players, sessions, upcomingMatches, feeRecords, recentAttendance] = await Promise.all([
    Sport.countDocuments(), Coach.countDocuments(), Team.countDocuments(), Player.countDocuments({ status: 'Active' }), TrainingSession.countDocuments(), Match.countDocuments({ status: { $in: ['Upcoming','Scheduled'] } }), FeeRecord.find().select('amount dueDate'), Attendance.countDocuments({ status: 'Present' }),
  ]);
  const fees = await addFeeBalances(feeRecords);
  const pendingFees = fees.filter((fee) => fee.status === 'Pending' || fee.status === 'Overdue').length;
  return sendItem(res, { sports, coaches, teams, players, sessions, upcomingMatches, pendingFees, presentAttendanceRecords: recentAttendance });
}));
reportApiRouter.get('/attendance.csv', asyncHandler(async (_req, res) => {
  const rows = await Attendance.find().sort({ markedAt: -1 }).limit(10000).populate('playerId', 'name').populate('sessionId', 'title date');
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"','""')}"`;
  const csv = ['player,session,date,status,markedAt', ...rows.map((row) => {
    const player = row.playerId as unknown as { name?: string }; const session = row.sessionId as unknown as { title?: string; date?: Date };
    return [player?.name, session?.title, session?.date?.toISOString(), row.status, row.markedAt.toISOString()].map(escape).join(',');
  })].join('\r\n');
  res.type('text/csv').attachment('athletix-attendance.csv').send(csv);
}));
