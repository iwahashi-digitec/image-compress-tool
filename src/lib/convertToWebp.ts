import type { QualityLevel } from '../types';
import { webpPresets } from '../constants/qualityPresets';

export async function convertToWebp(
  source: File | Blob,
  level: QualityLevel,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const preset = webpPresets[level];
  onProgress(10);

  const bitmap = await createImageBitmap(source);
  onProgress(30);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  onProgress(50);

  const webpBlob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: preset.quality,
  });
  onProgress(100);

  return webpBlob;
}
