import { readPsd } from 'ag-psd';
import type { QualityLevel } from '../types';

export type PsdOutputFormat = 'jpeg' | 'png';

const jpegQuality: Record<QualityLevel, number> = {
  'high-compression': 0.6,
  recommended: 0.85,
  'low-compression': 0.95,
};

export async function convertPsd(
  file: File,
  format: PsdOutputFormat,
  level: QualityLevel,
  onProgress: (progress: number) => void
): Promise<Blob> {
  onProgress(10);

  const buffer = await file.arrayBuffer();
  onProgress(30);

  const psd = readPsd(buffer, { skipLayerImageData: true });
  onProgress(70);

  if (!psd.canvas) {
    throw new Error(
      'PSDから画像を取得できませんでした。Photoshopで保存する際に「互換性を最大化」オプションを有効にして保存し直してください。'
    );
  }

  return new Promise((resolve, reject) => {
    psd.canvas!.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('画像の変換に失敗しました'));
          return;
        }
        onProgress(100);
        resolve(blob);
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      format === 'jpeg' ? jpegQuality[level] : undefined
    );
  });
}
