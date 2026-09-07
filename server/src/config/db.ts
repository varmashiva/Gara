import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let memoryServerHandle: { stop: () => Promise<boolean> } | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (!uri) {
    if (env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    // Dev convenience: no local Mongo/Docker required to run the app.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    memoryServerHandle = mem;
    uri = mem.getUri();
    logger.info('No MONGODB_URI set — started in-memory MongoDB for development', { uri });
  }

  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServerHandle) {
    await memoryServerHandle.stop();
  }
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
