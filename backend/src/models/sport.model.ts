import { Schema } from 'mongoose';
import { registerModel } from './base.js';
export const SPORT_CATEGORIES = ['Team', 'Individual'] as const;
export interface SportDoc { name: string; category: (typeof SPORT_CATEGORIES)[number]; description: string; emoji?: string; details?: string; active: boolean; createdAt: Date; updatedAt: Date }
const schema = new Schema<SportDoc>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, enum: SPORT_CATEGORIES, required: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  emoji: { type: String, trim: true, maxlength: 12 }, details: { type: String, trim: true, maxlength: 1000 },
  active: { type: Boolean, default: true, required: true },
}, { timestamps: true });
export const Sport = registerModel<SportDoc>('Sport', schema);
