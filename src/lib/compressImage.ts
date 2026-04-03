import imageCompression from 'browser-image-compression';
import type { QualityLevel } from '../types';
import { compressionPresets } from '../constants/qualityPresets';

export async function compressImage(
  file: File,
  level: QualityLevel,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const preset = compressionPresets[level];

  const options = {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    initialQuality: preset.quality,
    onProgress: (p: number) => {
      onProgress(Math.min(p, 100));
    },
  };

  const compressed = await imageCompression(file, options);
  onProgress(100);
  return compressed;
}
