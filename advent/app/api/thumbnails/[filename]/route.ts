import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { paths } from '@/lib/config/paths';
import { InitService } from '@/lib/services/initService';

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  await InitService.initialize();

  const filename = params.filename;
  if (!filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const candidates = [
    path.join(paths.thumbnailsDir, filename),
    path.join(paths.publicThumbnailsDir, filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const buffer = await fs.promises.readFile(candidate);
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

      // Convert Node Buffer to a typed array (compatible with Fetch Response body)
      const arrayView = new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength
      );

      const arrayBuffer = arrayView.buffer as ArrayBuffer;

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
