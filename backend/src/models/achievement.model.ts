import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export const ACHIEVEMENT_TYPES = ['Trophy', 'Medal', 'Award', 'Milestone'] as const;
export interface AchievementDoc { title: string; type: (typeof ACHIEVEMENT_TYPES)[number]; recipientType: 'player' | 'team'; playerId?: Types.ObjectId; teamId?: Types.ObjectId; sportId: Types.ObjectId; date: Date; description: string; featured: boolean; createdAt: Date; updatedAt: Date }
const schema = new Schema<AchievementDoc>({
  title: { type: String, required: true, trim: true, maxlength: 160 }, type: { type: String, enum: ACHIEVEMENT_TYPES, required: true },
  recipientType: { type: String, enum: ['player', 'team'], required: true }, playerId: { type: Schema.Types.ObjectId, ref: 'Player' }, teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true }, date: { type: Date, required: true },
  description: { type: String, default: '', trim: true, maxlength: 2000 }, featured: { type: Boolean, default: false, required: true },
}, { timestamps: true });
schema.pre('validate', function () {
  const validPlayer = this.recipientType === 'player' && Boolean(this.playerId) && !this.teamId;
  const validTeam = this.recipientType === 'team' && Boolean(this.teamId) && !this.playerId;
  if (!validPlayer && !validTeam) this.invalidate('recipientType', 'Provide exactly one recipient reference matching recipientType.');
});
schema.index({ featured: 1, date: -1 });
export const Achievement = registerModel<AchievementDoc>('Achievement', schema);
