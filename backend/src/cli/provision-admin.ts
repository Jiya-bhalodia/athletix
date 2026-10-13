import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { connectToDatabase } from '../db.js';
import { loadConfig } from '../config.js';
import { provisionInitialAdmin } from '../auth/provision-admin.js';

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
  if (!process.argv.includes('--confirm-admin-provisioning')) throw new Error('Pass --confirm-admin-provisioning to create the initial admin account.');
  const config = loadConfig();
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const email = await prompt.question('Admin email: ');
    prompt.close();
    const password = await readPassword('Password (input hidden): ');
    const confirmation = await readPassword('Confirm password (input hidden): ');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    await connectToDatabase(config.mongoUri);
    await provisionInitialAdmin(email, password, true);
    console.log('Initial admin account created. Sign-in credentials were not displayed.');
  } finally {
    prompt.close();
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  }
}

run().catch((error: unknown) => {
  console.error(`Admin provisioning failed: ${error instanceof Error ? error.message : 'unexpected error'}`);
  process.exitCode = 1;
});
