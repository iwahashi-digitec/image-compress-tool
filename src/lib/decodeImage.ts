/**
 * さまざまな形式の画像ファイルを canvas に読み込む。
 * - ブラウザが標準で読める形式（JPEG / PNG / WebP / GIF / BMP / AVIF / SVG / ICO）は <img> で読み込む
 * - TIFF / HEIC / PSD はライブラリで読み込む（必要になった時だけ動的 import）
 * - Illustrator / EPS は decodeVector.ts で描画する
 */
import { decodeIllustrator, decodeEps } from './decodeVector';

/** ベクター形式（解像度を指定して書き出せる形式）か */
export function isVectorFile(file: File): boolean {
  return ['svg', 'ai', 'eps'].includes(getExt(file)) || file.type === 'image/svg+xml';
}

function getExt(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadWithImg(blob: Blob, isSvg = false, svgScale = 1): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // サイズ指定のない SVG は naturalWidth が 0 になることがあるため既定値を使う
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (isSvg) {
        if (!w || !h) {
          w = 1024;
          h = 1024;
        }
        const scale = Math.min(svgScale, 16000 / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas を初期化できませんでした'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像を読み込めませんでした（ファイルが壊れているか、このブラウザで非対応の形式です）'));
    };
    img.src = url;
  });
}

async function loadTiff(file: File): Promise<HTMLCanvasElement> {
  const { default: UTIF } = await import('utif');
  const buf = await file.arrayBuffer();
  const ifds = UTIF.decode(buf);
  if (ifds.length === 0) throw new Error('TIFFを読み込めませんでした');
  // 複数ページの場合は最も大きいページ（サムネイルを除外）を使う
  const area = (ifd: (typeof ifds)[number]) => {
    const w = (ifd.t256 as number[] | undefined)?.[0] ?? 0;
    const h = (ifd.t257 as number[] | undefined)?.[0] ?? 0;
    return w * h;
  };
  const target = ifds.reduce((a, b) => (area(b) > area(a) ? b : a));
  UTIF.decodeImage(buf, target, ifds);
  const rgba = UTIF.toRGBA8(target);
  const canvas = createCanvas(target.width, target.height);
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), target.width, target.height), 0, 0);
  return canvas;
}

async function loadHeic(file: File): Promise<HTMLCanvasElement> {
  // Safari は HEIC を標準で読めるので、まず標準の読み込みを試す
  try {
    return await loadWithImg(file);
  } catch {
    const { default: heic2any } = await import('heic2any');
    const result = await heic2any({ blob: file, toType: 'image/png' });
    const blob = Array.isArray(result) ? result[0] : result;
    return loadWithImg(blob);
  }
}

async function loadPsd(file: File): Promise<HTMLCanvasElement> {
  const { readPsd } = await import('ag-psd');
  const psd = readPsd(await file.arrayBuffer(), { skipLayerImageData: true });
  if (!psd.canvas) {
    throw new Error(
      'PSDから画像を取得できませんでした。Photoshopで「互換性を最大化」を有効にして保存し直してください。'
    );
  }
  return psd.canvas as HTMLCanvasElement;
}

export interface DecodeOptions {
  /** ベクター形式（SVG / AI / EPS）の拡大率。1 = 等倍（72dpi） */
  vectorScale?: number;
}

export async function decodeImage(file: File, options: DecodeOptions = {}): Promise<HTMLCanvasElement> {
  const ext = getExt(file);
  const scale = options.vectorScale ?? 1;
  if (ext === 'ai') return decodeIllustrator(file, scale);
  if (ext === 'eps' || ext === 'epsf' || ext === 'epsi' || ext === 'ps') return decodeEps(file, scale);
  if (ext === 'tif' || ext === 'tiff' || file.type === 'image/tiff') return loadTiff(file);
  if (ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') return loadHeic(file);
  if (ext === 'psd') return loadPsd(file);
  return loadWithImg(file, ext === 'svg' || file.type === 'image/svg+xml', scale);
}
