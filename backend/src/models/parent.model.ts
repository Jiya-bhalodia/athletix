import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface ParentDoc { userId?: Types.ObjectId; name: string; email: string; phone: string; childIds: Types.ObjectId[]; createdAt: Date; updatedAt: Date }
const schema = new Schema<ParentDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^\S+@\S+\.\S+$/ }, phone: { type: String, required: true, trim: true, maxlength: 30 },
  childIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Player' }], default: [], validate: {
    validator(ids: Types.ObjectId[]) { return new Set(ids.map(String)).size === ids.length; },
    message: 'A child can only be linked once to the same parent.',
  } },
}, { timestamps: true });
schema.index({ userId: 1 }, { unique: true, sparse: true }); schema.index({ childIds: 1 });
export const Parent = registerModel<ParentDoc>('Parent', schema);
