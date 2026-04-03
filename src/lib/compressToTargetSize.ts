import imageCompression from 'browser-image-compression';

export async function compressToTargetSize(
  file: File,
  targetSizeKB: number,
  onProgress: (progress: number) => void
): Promise<Blob> {
  const targetSizeMB = targetSizeKB / 1024;

  const options = {
    maxSizeMB: targetSizeMB,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    initialQuality: 0.85,
    onProgress: (p: number) => {
      onProgress(Math.min(p, 100));
    },
  };

  const compressed = await imageCompression(file, options);
  onProgress(100);
  return compressed;
}
