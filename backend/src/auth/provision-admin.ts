import argon2 from 'argon2';
import { Types } from 'mongoose';
import { User } from '../models/index.js';

export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter a valid email address.');
  return normalized;
}

export async function provisionInitialAdmin(emailInput: string, password: string, confirmed: boolean) {
  if (!confirmed) throw new Error('Admin provisioning requires --confirm-admin-provisioning.');
  if (password.length < 12 || password.length > 128) throw new Error('Password must be between 12 and 128 characters.');
  const email = normalizeEmail(emailInput);
  const locks = User.db.db?.collection('auth_provisioning_locks');
  if (!locks) throw new Error('Database connection is required for admin provisioning.');
  const lockId = new Types.ObjectId('000000000000000000000001');
  try {
    await locks.insertOne({ _id: lockId, createdAt: new Date() });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) throw new Error('Initial admin provisioning has already run or is in progress.');
    throw error;
  }
  try {
    if (await User.exists({ role: 'admin' })) throw new Error('An admin account already exists; refusing to create another initial admin.');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    return await User.create({ email, role: 'admin', status: 'active', passwordHash });
  } catch (error) {
    if (!await User.exists({ role: 'admin' })) await locks.deleteOne({ _id: lockId });
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) throw new Error('An account with that email already exists.');
    throw error;
  }
}
