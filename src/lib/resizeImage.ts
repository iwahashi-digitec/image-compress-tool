export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspect: boolean;
}

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
 * Canvas API を使って画像をリサイズ・トリミング処理する。
 * crop と resize はどちらか片方でも両方でも指定可能。
 * 両方指定時は「先にトリミング → その後リサイズ」の順で適用される。
 */
export async function processImage(
  source: File | Blob,
  options: {
    crop?: CropPercent;
    resize?: ResizeOptions;
  },
  onProgress: (progress: number) => void
): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    onProgress(10);
    const img = await loadImage(url);
    onProgress(40);

    // ── Step 1: トリミング範囲を決定 ──────────────────────────
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

    // ── Step 2: 出力サイズを決定 ──────────────────────────────
    let dstW = srcW;
    let dstH = srcH;

    if (options.resize) {
      const r = options.resize;
      const hasW = r.width != null && r.width > 0;
      const hasH = r.height != null && r.height > 0;

      if (hasW && hasH) {
        if (r.maintainAspect) {
          // Fit: 縦横比を保ちながら指定枠内に収める
          const ratio = Math.min(r.width! / srcW, r.height! / srcH);
          dstW = Math.round(srcW * ratio);
          dstH = Math.round(srcH * ratio);
        } else {
          // Stretch: 指定通りのサイズ（歪む可能性あり）
          dstW = r.width!;
          dstH = r.height!;
        }
      } else if (hasW) {
        dstW = r.width!;
        dstH = r.maintainAspect ? Math.round((srcH / srcW) * r.width!) : srcH;
      } else if (hasH) {
        dstH = r.height!;
        dstW = r.maintainAspect ? Math.round((srcW / srcH) * r.height!) : srcW;
      }
    }

    // ── Step 3: Canvas に描画 ─────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context を取得できませんでした');

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);
    onProgress(80);

    // 元ファイルと同じ MIME タイプで出力（WebP 非対応ブラウザでは JPEG にフォールバック）
    const mimeType = source instanceof File
      ? (source.type || 'image/jpeg')
      : 'image/jpeg';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('画像の変換に失敗しました'))),
        mimeType,
        0.92
      );
    });

    onProgress(100);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** リサイズ後の寸法を計算する（プレビュー表示用） */
export function calcResizeDimensions(
  originalW: number,
  originalH: number,
  resize: ResizeOptions
): { width: number; height: number } {
  const hasW = resize.width != null && resize.width > 0;
  const hasH = resize.height != null && resize.height > 0;

  if (hasW && hasH) {
    if (resize.maintainAspect) {
      const ratio = Math.min(resize.width! / originalW, resize.height! / originalH);
      return { width: Math.round(originalW * ratio), height: Math.round(originalH * ratio) };
    }
    return { width: resize.width!, height: resize.height! };
  } else if (hasW) {
    return {
      width: resize.width!,
      height: resize.maintainAspect ? Math.round((originalH / originalW) * resize.width!) : originalH,
    };
  } else if (hasH) {
    return {
      width: resize.maintainAspect ? Math.round((originalW / originalH) * resize.height!) : originalW,
      height: resize.height!,
    };
  }
  return { width: originalW, height: originalH };
}
