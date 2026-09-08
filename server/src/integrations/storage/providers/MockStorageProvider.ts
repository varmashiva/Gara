import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { StorageProvider, UploadFileParams, UploadFileResult } from '../StorageProvider';
import { env } from '../../../config/env';

const UPLOAD_DIR = path.join(__dirname, '../../../../uploads');

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Local-dev/test provider — saves to disk under server/uploads/, served
 * statically by Express (see app.ts). No Cloudinary account needed.
 */
export class MockStorageProvider implements StorageProvider {
  async upload(params: UploadFileParams): Promise<UploadFileResult> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXTENSION_BY_MIME[params.mimeType] ?? 'bin';
    const publicId = `${params.folder}/${randomUUID()}`;
    const filename = `${publicId.replace(/\//g, '_')}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), params.buffer);
    return { url: `${env.PUBLIC_SERVER_URL}/uploads/${filename}`, publicId };
  }

  async delete(publicId: string): Promise<void> {
    const filename = `${publicId.replace(/\//g, '_')}`;
    const dir = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
    const match = dir.find((f) => f.startsWith(filename));
    if (match) await fs.unlink(path.join(UPLOAD_DIR, match)).catch(() => undefined);
  }
}
