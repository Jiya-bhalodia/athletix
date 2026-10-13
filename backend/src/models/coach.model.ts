import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface CoachDoc { userId?: Types.ObjectId; name: string; email: string; phone: string; sportId: Types.ObjectId; experience: number; schedule: string; status: 'Active' | 'On leave'; createdAt: Date; updatedAt: Date }
const schema = new Schema<CoachDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^\S+@\S+\.\S+$/ }, phone: { type: String, required: true, trim: true, maxlength: 30 },
  sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true }, experience: { type: Number, required: true, min: 0, max: 60 },
  schedule: { type: String, required: true, trim: true, maxlength: 300 }, status: { type: String, enum: ['Active', 'On leave'], default: 'Active', required: true },
}, { timestamps: true });
schema.index({ userId: 1 }, { unique: true, sparse: true });
export const Coach = registerModel<CoachDoc>('Coach', schema);
