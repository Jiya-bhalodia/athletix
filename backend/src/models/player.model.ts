import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface PlayerDoc { userId?: Types.ObjectId; name: string; email: string; phone: string; age: number; sportId: Types.ObjectId; teamId?: Types.ObjectId; joinDate: Date; emergencyName: string; emergencyPhone: string; status: 'Active' | 'Inactive'; createdAt: Date; updatedAt: Date }
const schema = new Schema<PlayerDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^\S+@\S+\.\S+$/ }, phone: { type: String, required: true, trim: true, maxlength: 30 },
  age: { type: Number, required: true, min: 4, max: 100 }, sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: undefined }, joinDate: { type: Date, required: true },
  emergencyName: { type: String, required: true, trim: true, maxlength: 100 }, emergencyPhone: { type: String, required: true, trim: true, maxlength: 30 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
}, { timestamps: true });
schema.index({ userId: 1 }, { unique: true, sparse: true }); schema.index({ sportId: 1 }); schema.index({ teamId: 1 });
export const Player = registerModel<PlayerDoc>('Player', schema);
