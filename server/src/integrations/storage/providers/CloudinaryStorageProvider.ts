import crypto from 'crypto';
import { StorageProvider, UploadFileParams, UploadFileResult } from '../StorageProvider';
import { env } from '../../../config/env';

/**
 * Cloudinary's signed Upload API (https://cloudinary.com/documentation/upload_images)
 * — stable, long-documented contract: sign every param except file/api_key/
 * cloud_name/resource_type, sorted alphabetically as key=value pairs joined
 * by '&', SHA-1 hashed with the API secret appended (not HMAC — a plain
 * SHA-1 digest of the concatenated string, per Cloudinary's documented
 * algorithm). Not exercised against the live API this session (no
 * credentials available here), only implemented to the documented shape.
 */
export class CloudinaryStorageProvider implements StorageProvider {
  async upload(params: UploadFileParams): Promise<UploadFileResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    // `format: 'webp'` tells Cloudinary to transcode and store the asset as
    // WebP regardless of the uploaded format (jpg/png/etc.) — every image in
    // this app is stored as WebP, per product requirement. It's a signed
    // param like any other, so it must be included in the signature.
    const signableParams = { folder: params.folder, format: 'webp', timestamp };
    const paramString = Object.keys(signableParams)
      .sort()
      .map((key) => `${key}=${(signableParams as Record<string, unknown>)[key]}`)
      .join('&');
    const signature = crypto
      .createHash('sha1')
      .update(paramString + env.CLOUDINARY_API_SECRET)
      .digest('hex');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(params.buffer)], { type: params.mimeType }));
    form.append('api_key', env.CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('folder', params.folder);
    form.append('format', 'webp');
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { secure_url: string; public_id: string };
    return { url: data.secure_url, publicId: data.public_id };
  }

  async delete(publicId: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramString = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramString + env.CLOUDINARY_API_SECRET)
      .digest('hex');

    const form = new FormData();
    form.append('public_id', publicId);
    form.append('api_key', env.CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary delete failed: ${response.status} ${await response.text()}`);
    }
  }
}
