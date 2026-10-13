import { Schema } from 'mongoose';
import { registerModel } from './base.js';
export const ANNOUNCEMENT_KINDS = ['Announcement', 'Event', 'Match update', 'Training notice'] as const;
export interface AnnouncementDoc { title: string; kind: (typeof ANNOUNCEMENT_KINDS)[number]; date: Date; body: string; published: boolean; createdAt: Date; updatedAt: Date }
const schema = new Schema<AnnouncementDoc>({
  title: { type: String, required: true, trim: true, maxlength: 160 }, kind: { type: String, enum: ANNOUNCEMENT_KINDS, required: true },
  date: { type: Date, required: true }, body: { type: String, required: true, trim: true, maxlength: 5000 }, published: { type: Boolean, default: false, required: true },
}, { timestamps: true });
schema.index({ published: 1, date: -1 });
export const Announcement = registerModel<AnnouncementDoc>('Announcement', schema);
