import type { QualityLevel } from '../types';
import { webpPresets } from '../constants/qualityPresets';

export async function convertToWebp(
  source: File | Blob,
  level: QualityLevel,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const preset = webpPresets[level];
  onProgress(10);

  const url = URL.createObjectURL(source);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      onProgress(30);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      onProgress(50);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('WebP変換に失敗しました'));
            return;
          }
          onProgress(100);
          resolve(blob);
        },
        'image/webp',
        preset.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = url;
  });
}
