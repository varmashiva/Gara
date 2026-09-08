export interface UploadFileParams {
  buffer: Buffer;
  mimeType: string;
  folder: string;
}

export interface UploadFileResult {
  url: string;
  publicId: string;
}

/**
 * Business logic depends on this interface, never on Cloudinary (or any
 * other storage vendor) directly (Rule 20).
 */
export interface StorageProvider {
  upload(params: UploadFileParams): Promise<UploadFileResult>;
  delete(publicId: string): Promise<void>;
}
