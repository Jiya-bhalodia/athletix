import { Schema, Types } from 'mongoose';
import { registerModel } from './base.js';
export interface AttendanceDoc { sessionId: Types.ObjectId; playerId: Types.ObjectId; status: 'Present' | 'Absent' | 'Late' | 'Excused'; markedAt: Date; createdAt: Date; updatedAt: Date }
const schema = new Schema<AttendanceDoc>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true }, playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], required: true }, markedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });
schema.index({ sessionId: 1, playerId: 1 }, { unique: true }); schema.index({ playerId: 1 });
export const Attendance = registerModel<AttendanceDoc>('Attendance', schema);
