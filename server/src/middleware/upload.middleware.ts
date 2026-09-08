import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { readImageDimensions } from '../utils/imageDimensions';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION_PX = 6000; // guards against decompression-bomb-style resource exhaustion
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Magic-byte signatures — checked against the actual file bytes, not just
// the client-supplied filename/mimetype (which is trivially spoofable), per
// the design doc's "secure file upload validation" requirement.
const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  // WEBP: "RIFF" .... "WEBP" — check the two fixed segments around the size field.
];

function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }
  const signature = MAGIC_BYTES.find((s) => s.mime === mimeType);
  if (!signature) return false;
  return signature.bytes.every((byte, i) => buffer[i] === byte);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError('Only JPEG, PNG, or WEBP images are allowed', 400, 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

export function uploadSingleImage(fieldName: string) {
  const middleware = upload.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) return next(err);
      if (!req.file) {
        return next(AppError.badRequest('No file uploaded', 'NO_FILE_UPLOADED'));
      }
      if (!matchesMagicBytes(req.file.buffer, req.file.mimetype)) {
        return next(AppError.badRequest('File content does not match its declared type', 'INVALID_FILE_CONTENT'));
      }
      const dimensions = readImageDimensions(req.file.buffer, req.file.mimetype);
      if (dimensions && (dimensions.width > MAX_DIMENSION_PX || dimensions.height > MAX_DIMENSION_PX)) {
        return next(
          AppError.badRequest(`Image dimensions must not exceed ${MAX_DIMENSION_PX}x${MAX_DIMENSION_PX}px`, 'IMAGE_TOO_LARGE')
        );
      }
      next();
    });
  };
}
