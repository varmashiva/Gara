/**
 * Minimal, dependency-free dimension readers for the two formats where this
 * is a fixed/simple header parse (PNG, JPEG). WEBP's dimension encoding
 * varies by sub-format (VP8/VP8L/VP8X) and isn't implemented here — WEBP
 * uploads fall back to the file-size limit alone as their resource-
 * exhaustion backstop, which is a real gap, just a narrower one.
 */
export function readImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  if (mimeType === 'image/png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (mimeType === 'image/jpeg') {
    let offset = 2; // skip the 0xFFD8 SOI marker
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      // SOF0-SOF15 except the DHT/JPG/DAC markers (C4, C8, CC) carry dimensions.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
    return null;
  }

  return null;
}
