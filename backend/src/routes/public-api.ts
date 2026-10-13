import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Achievement, Announcement, EnrollmentInquiry, Sport } from '../models/index.js';
import { allowFields, ApiError, asyncHandler, pagination, searchFilter, sendItem, sendPage } from '../api/common.js';

export const publicApiRouter = Router();
const inquiryLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many inquiries. Please try again later.' } } });

publicApiRouter.get('/sports', asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const filter: Record<string, unknown> = { active: true };
  for (const field of ['category'] as const) if (req.query[field] !== undefined) filter[field] = req.query[field];
  const q = req.query.q;
  if (q !== undefined && (typeof q !== 'string' || q.length > 100)) throw new ApiError(400, 'Invalid search query');
  const query = { ...filter, ...searchFilter(typeof q === 'string' ? q : '', ['name','description']) };
  const [rows,total] = await Promise.all([Sport.find(query).sort({ name: 1 }).skip(skip).limit(limit), Sport.countDocuments(query)]);
  return sendPage(res, rows, total, page, limit);
}));

publicApiRouter.get('/achievements', asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const query = { featured: true };
  const [rows,total] = await Promise.all([
    Achievement.find(query).sort({ date: -1 }).skip(skip).limit(limit).populate('sportId', 'name').populate('playerId', 'name').populate('teamId', 'name'),
    Achievement.countDocuments(query),
  ]);
  const data = rows.map((row) => {
    const value = row.toObject() as Record<string, any>;
    const recipient = value.recipientType === 'player' ? value.playerId?.name : value.teamId?.name;
    return { id: String(value._id), title: value.title, type: value.type, recipient: recipient ?? 'Athletix team', sport: value.sportId?.name ?? '', date: value.date, description: value.description };
  });
  return sendPage(res, data, total, page, limit);
}));

publicApiRouter.get('/announcements', asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const query: Record<string, unknown> = { published: true };
  if (req.query.kind !== undefined) {
    if (typeof req.query.kind !== 'string') throw new ApiError(400, 'Invalid kind filter');
    query.kind = req.query.kind;
  }
  const [rows,total] = await Promise.all([Announcement.find(query).sort({ date: -1 }).skip(skip).limit(limit), Announcement.countDocuments(query)]);
  return sendPage(res, rows, total, page, limit);
}));

publicApiRouter.post('/enrollment-inquiries', inquiryLimit, asyncHandler(async (req, res) => {
  const data = allowFields(req.body, ['name','email','phone','sport','message'], ['name','email','phone','sport']);
  if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
  if (typeof data.sport !== 'string' || !await Sport.exists({ active: true, name: { $regex: `^${data.sport.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })) throw new ApiError(400, 'Select an available sport');
  const inquiry = await EnrollmentInquiry.create(data);
  return sendItem(res, { id: inquiry.id, status: inquiry.status, receivedAt: inquiry.receivedAt }, 201);
}));
