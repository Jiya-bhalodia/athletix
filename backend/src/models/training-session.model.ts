import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface TrainingSessionDoc { title: string; teamId: Types.ObjectId; coachId: Types.ObjectId; date: Date; time: string; venue: string; createdAt: Date; updatedAt: Date }
const schema = new Schema<TrainingSessionDoc>({
  title: { type: String, required: true, trim: true, maxlength: 120 }, teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  coachId: { type: Schema.Types.ObjectId, ref: 'Coach', required: true }, date: { type: Date, required: true },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, venue: { type: String, required: true, trim: true, maxlength: 120 },
}, { timestamps: true });
schema.index({ teamId: 1, date: 1 });
export const TrainingSession = registerModel<TrainingSessionDoc>('TrainingSession', schema);
