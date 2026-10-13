import argon2 from 'argon2';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectToDatabase } from '../db.js';
import { loadConfig } from '../config.js';
import { normalizeEmail } from '../auth/provision-admin.js';
import { Coach, Parent, Player, User, type UserRole } from '../models/index.js';

function readPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') throw new Error('Run this command in an interactive terminal.');
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    let password = '';
    const onData = (chunk: Buffer) => {
      const key = chunk.toString('utf8');
      if (key === '\u0003') { cleanup(); reject(new Error('Cancelled.')); return; }
      if (key === '\r' || key === '\n') { cleanup(); stdout.write('\n'); resolve(password); return; }
      if (key === '\u007f' || key === '\b') password = password.slice(0, -1);
      else if (key >= ' ' && key <= '~' && password.length < 128) password += key;
    };
    const cleanup = () => { stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); };
    stdin.setRawMode(true); stdin.resume(); stdin.on('data', onData);
  });
}

async function run() {
  const roleArg = process.argv.find((arg) => arg.startsWith('--role='))?.slice('--role='.length);
  if (!['coach', 'player', 'parent'].includes(roleArg ?? '') || !process.argv.includes('--confirm-account-provisioning')) {
    throw new Error('Use --role=coach|player|parent and --confirm-account-provisioning. This tool does not create admin accounts.');
  }
  const role = roleArg as Extract<UserRole, 'coach' | 'player' | 'parent'>;
  const config = loadConfig();
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const email = normalizeEmail(await prompt.question(`${role[0]!.toUpperCase()}${role.slice(1)} profile email: `));
    prompt.close();
    const password = await readPassword('Password (12+ characters, input hidden): ');
    const confirmation = await readPassword('Confirm password (input hidden): ');
    if (password.length < 12 || password.length > 128) throw new Error('Password must be between 12 and 128 characters.');
    if (password !== confirmation) throw new Error('Passwords do not match.');

    await connectToDatabase(config.mongoUri);
    const profile = role === 'coach' ? await Coach.findOne({ email })
      : role === 'player' ? await Player.findOne({ email })
        : await Parent.findOne({ email });
    if (!profile) throw new Error(`No ${role} profile has that email. Create the profile in the admin dashboard first.`);
    if (profile.userId) throw new Error('This profile already has a login account.');
    if (await User.exists({ email })) throw new Error('An account with that email already exists.');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const links = role === 'coach' ? { coachId: profile._id } : role === 'player' ? { playerId: profile._id } : { parentId: profile._id };
    const account = await User.create({ email, role, status: 'active', passwordHash, ...links });
    try {
      const result = role === 'coach' ? await Coach.updateOne({ _id: profile._id, userId: { $exists: false } }, { $set: { userId: account._id } })
        : role === 'player' ? await Player.updateOne({ _id: profile._id, userId: { $exists: false } }, { $set: { userId: account._id } })
          : await Parent.updateOne({ _id: profile._id, userId: { $exists: false } }, { $set: { userId: account._id } });
      if (!result.modifiedCount) throw new Error('Profile was linked to another account; account creation was rolled back.');
    } catch (error) {
      await User.deleteOne({ _id: account._id });
      throw error;
    }
    console.log(`${role[0]!.toUpperCase()}${role.slice(1)} login provisioned. Credentials were not displayed.`);
  } finally {
    prompt.close();
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  }
}

run().catch((error: unknown) => {
  console.error(`Account provisioning failed: ${error instanceof Error ? error.message : 'unexpected error'}`);
  process.exitCode = 1;
});
