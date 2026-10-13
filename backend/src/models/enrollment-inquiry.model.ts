import { Schema } from 'mongoose';
import { registerModel } from './base.js';
export interface EnrollmentInquiryDoc { name: string; email: string; phone: string; sport: string; message?: string; status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; receivedAt: Date; createdAt: Date; updatedAt: Date }
const schema = new Schema<EnrollmentInquiryDoc>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 }, email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^\S+@\S+\.\S+$/ },
  phone: { type: String, required: true, trim: true, match: /^[+\d\s-]{7,15}$/ }, sport: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  message: { type: String, trim: true, maxlength: 1000 }, status: { type: String, enum: ['New', 'Contacted', 'Enrolled', 'Closed'], default: 'New', required: true },
  receivedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });
schema.index({ receivedAt: -1 });
export const EnrollmentInquiry = registerModel<EnrollmentInquiryDoc>('EnrollmentInquiry', schema);
