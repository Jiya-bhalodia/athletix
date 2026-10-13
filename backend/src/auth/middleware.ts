import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { Coach, Parent, Player, Team, User, type UserRole } from '../models/index.js';

export interface AuthPrincipal {
  userId: string;
  role: UserRole;
  profileId?: string;
}

/** Returns false for invalid role/profile links, null for a valid admin, or the linked profile ID. */
export async function resolveProfile(user: { _id: unknown; role: UserRole; coachId?: unknown; playerId?: unknown; parentId?: unknown }): Promise<string | null | false> {
  const hasCoach = Boolean(user.coachId); const hasPlayer = Boolean(user.playerId); const hasParent = Boolean(user.parentId);
  if (user.role === 'admin') return !hasCoach && !hasPlayer && !hasParent ? null : false;
  if (user.role === 'coach' && hasCoach && !hasPlayer && !hasParent && await Coach.exists({ _id: user.coachId, userId: user._id })) return String(user.coachId);
  if (user.role === 'player' && hasPlayer && !hasCoach && !hasParent && await Player.exists({ _id: user.playerId, userId: user._id })) return String(user.playerId);
  if (user.role === 'parent' && hasParent && !hasCoach && !hasPlayer && await Parent.exists({ _id: user.parentId, userId: user._id })) return String(user.parentId);
  return false;
}

declare global {
  namespace Express {
    interface Locals { auth?: AuthPrincipal }
  }
}

export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) return res.status(401).json({ error: { message: 'Authentication required' } });
    const user = await User.findById(userId);
    if (!user || user.status !== 'active' || req.session.sessionVersion !== (user.sessionVersion ?? 0)) {
      await destroySession(req);
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const resolvedProfile = await resolveProfile(user);
    if (resolvedProfile === false) {
      await destroySession(req);
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
    res.locals.auth = { userId: String(user._id), role: user.role, ...(resolvedProfile ? { profileId: resolvedProfile } : {}) };
    next();
  } catch (error) { next(error); }
};

export function authorizeRoles(...roles: UserRole[]): RequestHandler {
  return (_req, res, next) => !res.locals.auth
    ? res.status(401).json({ error: { message: 'Authentication required' } })
    : roles.includes(res.locals.auth.role)
      ? next()
      : res.status(403).json({ error: { message: 'Forbidden' } });
}

/** Use after authenticate on routes with :playerId. */
export const authorizePlayerSelf: RequestHandler = (req, res, next) => {
  const auth = res.locals.auth;
  const playerId = routeParam(req.params.playerId);
  return auth?.role === 'admin' || (auth?.role === 'player' && auth.profileId === playerId)
    ? next()
    : res.status(auth ? 403 : 401).json({ error: { message: auth ? 'Forbidden' : 'Authentication required' } });
};

/** Use after authenticate on routes with :childId. */
export const authorizeParentChild: RequestHandler = async (req, res, next) => {
  try {
    const auth = res.locals.auth;
    if (auth?.role === 'admin') return next();
    const childId = routeParam(req.params.childId);
    if (auth?.role !== 'parent' || !auth.profileId || !Types.ObjectId.isValid(childId)) {
      return res.status(auth ? 403 : 401).json({ error: { message: auth ? 'Forbidden' : 'Authentication required' } });
    }
    const linked = await Parent.exists({ _id: auth.profileId, userId: auth.userId, childIds: childId });
    return linked ? next() : res.status(403).json({ error: { message: 'Forbidden' } });
  } catch (error) { next(error); }
};

/** Use after authenticate on routes with :teamId. */
export const authorizeCoachTeam: RequestHandler = async (req, res, next) => {
  try {
    const auth = res.locals.auth;
    if (auth?.role === 'admin') return next();
    const teamId = routeParam(req.params.teamId);
    if (auth?.role !== 'coach' || !auth.profileId || !Types.ObjectId.isValid(teamId)) {
      return res.status(auth ? 403 : 401).json({ error: { message: auth ? 'Forbidden' : 'Authentication required' } });
    }
    const team = await Team.findOne({ _id: teamId, coachId: auth.profileId }).select('_id');
    return team ? next() : res.status(403).json({ error: { message: 'Forbidden' } });
  } catch (error) { next(error); }
};

function destroySession(req: Parameters<RequestHandler>[0]): Promise<void> {
  return new Promise((resolve) => req.session.destroy(() => resolve()));
}

function routeParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}
