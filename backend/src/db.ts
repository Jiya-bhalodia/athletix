import mongoose from 'mongoose';

export async function connectToDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
