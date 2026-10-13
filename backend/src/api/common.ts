import type { Request, RequestHandler } from 'express';
import mongoose, { type Model, type Types } from 'mongoose';
import { ActivityAudit, type UserRole } from '../models/index.js';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function objectId(value: unknown, label = 'id'): Types.ObjectId {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) throw new ApiError(400, `Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
}

export function bodyObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Request body must be a JSON object');
  return body as Record<string, unknown>;
}

export function allowFields(body: unknown, allowed: readonly string[], required: readonly string[] = []): Record<string, unknown> {
  const input = bodyObject(body);
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new ApiError(400, `Unsupported field: ${unknown[0]}`);
  for (const key of required) if (input[key] === undefined || input[key] === null || input[key] === '') throw new ApiError(400, `${key} is required`);
  return input;
}

export function pagination(req: Request) {
  const page = parsePositive(req.query.page, 1, 'page');
  const limit = parsePositive(req.query.limit, 25, 'limit');
  if (limit > 100) throw new ApiError(400, 'limit must be 100 or less');
  return { page, limit, skip: (page - 1) * limit };
}
function parsePositive(value: unknown, fallback: number, name: string) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1) throw new ApiError(400, `Invalid ${name}`);
  return Number(value);
}

export function filterQuery(req: Request, allowed: readonly string[]) {
  const filter: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = req.query[key];
    if (value !== undefined) {
      if (typeof value !== 'string' || value.length > 120) throw new ApiError(400, `Invalid filter: ${key}`);
      filter[key] = /Id$/.test(key) ? objectId(value, key) : value;
    }
  }
  const q = req.query.q;
  if (q !== undefined && (typeof q !== 'string' || q.length > 100)) throw new ApiError(400, 'Invalid search query');
  return { filter, q: typeof q === 'string' ? q.trim() : '' };
}

export function searchFilter(q: string, fields: readonly string[]) {
  if (!q || !fields.length) return {};
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $or: fields.map((field) => ({ [field]: { $regex: escaped, $options: 'i' } })) };
}

export function safeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(safeValue);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toObject === 'function') return safeValue(obj.toObject());
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(obj)) {
      if (key === '__v' || key === 'passwordHash') continue;
      if (key === '_id') out.id = safeValue(item);
      else out[key] = safeValue(item);
    }
    return out;
  }
  return value;
}

export function sendItem(res: import('express').Response, data: unknown, status = 200) {
  return res.status(status).json({ data: safeValue(data) });
}
export function sendPage(res: import('express').Response, rows: unknown[], total: number, page: number, limit: number) {
  return res.json({ data: safeValue(rows), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function audit(actorId: string, action: string, entityType: string, entityId: unknown) {
  if (!mongoose.isValidObjectId(actorId) || !mongoose.isValidObjectId(entityId)) return;
  await ActivityAudit.create({ actorId, action, entityType, entityId, metadata: { source: 'api' } });
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
export async function paged(Model: Model<any>, req: Request, opts: { filters: readonly string[]; search: readonly string[]; scope?: Record<string, unknown> }) {
  const { page, limit, skip } = pagination(req);
  const { filter, q } = filterQuery(req, opts.filters);
  const query = { ...opts.scope, ...filter, ...searchFilter(q, opts.search) };
  const [rows, total] = await Promise.all([Model.find(query).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(limit), Model.countDocuments(query)]);
  return { rows, total, page, limit };
}
