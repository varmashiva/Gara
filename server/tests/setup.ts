import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet;

export async function connectTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  await replSet.stop();
}

export async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
