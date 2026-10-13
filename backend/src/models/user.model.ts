import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';

export const USER_ROLES = ['admin', 'coach', 'player', 'parent'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export interface UserDoc {
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  sessionVersion: number;
  coachId?: Types.ObjectId;
  playerId?: Types.ObjectId;
  parentId?: Types.ObjectId;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<UserDoc>({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^\S+@\S+\.\S+$/ },
  role: { type: String, enum: USER_ROLES, required: true },
  status: { type: String, enum: ['active', 'disabled'], default: 'active', required: true },
  sessionVersion: { type: Number, default: 0, required: true, min: 0, validate: Number.isInteger },
  coachId: { type: Schema.Types.ObjectId, ref: 'Coach' },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
  parentId: { type: Schema.Types.ObjectId, ref: 'Parent' },
  passwordHash: { type: String, select: false, minlength: 20, match: /^(?:\$argon2(?:id|i|d)\$|\$2[aby]\$)/ },
}, { timestamps: true });
schema.index({ email: 1 }, { unique: true });
export const User = registerModel<UserDoc>('User', schema);
