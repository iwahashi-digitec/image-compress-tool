export interface CropPercent {
  x: number;      // 0–100
  y: number;      // 0–100
  width: number;  // 0–100
  height: number; // 0–100
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Canvas API を使って画像をトリミングし、必要に応じて指定サイズにリサイズする。
 * outputSize を指定すると、トリミング後に正確にそのサイズに変換される。
 */
export async function processImage(
  source: File | Blob,
  options: {
    crop?: CropPercent;
    outputSize?: { width: number; height: number };
  },
  onProgress: (progress: number) => void
): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    onProgress(10);
    const img = await loadImage(url);
    onProgress(40);

    // トリミング範囲を決定
    let srcX = 0;
    let srcY = 0;
    let srcW = img.naturalWidth;
    let srcH = img.naturalHeight;

    if (options.crop) {
      const c = options.crop;
      srcX = Math.round((c.x / 100) * img.naturalWidth);
      srcY = Math.round((c.y / 100) * img.naturalHeight);
      srcW = Math.round((c.width / 100) * img.naturalWidth);
      srcH = Math.round((c.height / 100) * img.naturalHeight);
    }

    // 出力サイズ（アスペクト比を保ったまま outputSize に収める。拡大しない）
    let dstW: number;
    let dstH: number;
    if (options.outputSize) {
      const scale = Math.min(
        1,
        options.outputSize.width / srcW,
        options.outputSize.height / srcH,
      );
      dstW = Math.round(srcW * scale);
      dstH = Math.round(srcH * scale);
    } else {
      dstW = srcW;
      dstH = srcH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context を取得できませんでした');

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);
    onProgress(80);

    const mimeType = source instanceof File
      ? (source.type || 'image/jpeg')
      : 'image/jpeg';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('画像の変換に失敗しました'))),
        mimeType,
        1.0
      );
    });

    onProgress(100);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
