import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface PlayerPerformanceDoc { playerId: Types.ObjectId; matchId?: Types.ObjectId; rating: number; notes: string; createdAt: Date; updatedAt: Date }
const schema = new Schema<PlayerPerformanceDoc>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true }, matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
  rating: { type: Number, required: true, min: 0, max: 10 }, notes: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });
schema.index({ playerId: 1, matchId: 1 });
export const PlayerPerformance = registerModel<PlayerPerformanceDoc>('PlayerPerformance', schema);
