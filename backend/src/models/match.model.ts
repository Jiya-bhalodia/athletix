import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface MatchDoc { teamId: Types.ObjectId; opponent: string; date: Date; venue: string; tournament: string; ourScore: number | null; theirScore: number | null; status: 'Upcoming' | 'Completed'; createdAt: Date; updatedAt: Date }
const schema = new Schema<MatchDoc>({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, opponent: { type: String, required: true, trim: true, maxlength: 120 },
  date: { type: Date, required: true }, venue: { type: String, required: true, trim: true, maxlength: 120 }, tournament: { type: String, required: true, trim: true, maxlength: 120 },
  ourScore: { type: Number, min: 0, default: null }, theirScore: { type: Number, min: 0, default: null }, status: { type: String, enum: ['Upcoming', 'Completed'], required: true },
}, { timestamps: true });
schema.index({ teamId: 1, date: 1 });
export const Match = registerModel<MatchDoc>('Match', schema);
