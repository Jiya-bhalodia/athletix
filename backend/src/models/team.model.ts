import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface TeamDoc { name: string; sportId: Types.ObjectId; coachId: Types.ObjectId; ageGroup: string; active: boolean; createdAt: Date; updatedAt: Date }
const schema = new Schema<TeamDoc>({
  name: { type: String, required: true, trim: true, maxlength: 100 }, sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  coachId: { type: Schema.Types.ObjectId, ref: 'Coach', required: true }, ageGroup: { type: String, required: true, trim: true, maxlength: 40 },
  active: { type: Boolean, default: true, required: true },
}, { timestamps: true });
schema.index({ sportId: 1 }); schema.index({ coachId: 1 });
export const Team = registerModel<TeamDoc>('Team', schema);
