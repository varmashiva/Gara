import { StorageProvider } from './StorageProvider';
import { MockStorageProvider } from './providers/MockStorageProvider';
import { CloudinaryStorageProvider } from './providers/CloudinaryStorageProvider';
import { env } from '../../config/env';

export const storageProvider: StorageProvider =
  env.STORAGE_PROVIDER_MODE === 'real' ? new CloudinaryStorageProvider() : new MockStorageProvider();
