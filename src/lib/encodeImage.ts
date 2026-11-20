/**
 * canvas を指定の画像形式にエンコードする。
 * - JPEG / PNG / WebP はブラウザ標準の canvas.toBlob
 * - AVIF / GIF / TIFF はライブラリ（動的 import）
 * - BMP / ICO は自前でバイナリを組み立てる
 */
import type { QualityLevel } from '../types';
import { type OutputFormat, outputFormatMap, lossyQuality, avifQuality } from '../constants/outputFormats';

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('画像の書き出しに失敗しました'));
          return;
        }
        // 非対応のブラウザは黙って PNG を返すため、形式をチェックする
        if (blob.type !== mime) {
          reject(new Error('このブラウザはこの形式の書き出しに対応していません。Chrome または Edge をご利用ください'));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

/** 透過部分を白で塗りつぶした canvas を返す（JPEG / BMP 用） */
function flattenOnWhite(src: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

function getImageData(canvas: HTMLCanvasElement): ImageData {
  return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
}

function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const { width, height, data } = getImageData(flattenOnWhite(canvas));
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const buf = new ArrayBuffer(54 + pixelBytes);
  const v = new DataView(buf);
  // BITMAPFILEHEADER
  v.setUint8(0, 0x42); // 'B'
  v.setUint8(1, 0x4d); // 'M'
  v.setUint32(2, buf.byteLength, true);
  v.setUint32(10, 54, true);
  // BITMAPINFOHEADER
  v.setUint32(14, 40, true);
  v.setInt32(18, width, true);
  v.setInt32(22, height, true); // 正の値 = 下から上へ
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, pixelBytes, true);
  v.setInt32(38, 2835, true); // 72dpi
  v.setInt32(42, 2835, true);

  const out = new Uint8Array(buf, 54);
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * rowSize;
    for (let x = 0; x < width; x++) {
      const s = srcRow + x * 4;
      const d = dstRow + x * 3;
      out[d] = data[s + 2];
      out[d + 1] = data[s + 1];
      out[d + 2] = data[s];
    }
  }
  return new Blob([buf], { type: 'image/bmp' });
}

async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
  // ICO の1枚あたりの上限は 256×256。縦横比を保って正方形の中央に配置する
  const size = Math.min(256, Math.max(canvas.width, canvas.height));
  const scale = size / Math.max(canvas.width, canvas.height);
  const w = Math.round(canvas.width * scale);
  const h = Math.round(canvas.height * scale);
  const square = document.createElement('canvas');
  square.width = size;
  square.height = size;
  const ctx = square.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);

  const png = new Uint8Array(await (await toBlob(square, 'image/png')).arrayBuffer());
  const header = new ArrayBuffer(6 + 16);
  const v = new DataView(header);
  v.setUint16(0, 0, true); // reserved
  v.setUint16(2, 1, true); // type: icon
  v.setUint16(4, 1, true); // 画像数
  v.setUint8(6, size >= 256 ? 0 : size); // 0 は 256 を意味する
  v.setUint8(7, size >= 256 ? 0 : size);
  v.setUint8(8, 0);
  v.setUint8(9, 0);
  v.setUint16(10, 1, true); // color planes
  v.setUint16(12, 32, true); // bpp
  v.setUint32(14, png.byteLength, true);
  v.setUint32(18, 22, true); // データ開始位置
  return new Blob([header, png], { type: 'image/x-icon' });
}

async function encodeGif(canvas: HTMLCanvasElement): Promise<Blob> {
  const { quantize, applyPalette, GIFEncoder } = await import('gifenc');
  const { width, height, data } = getImageData(canvas);
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) {
      hasAlpha = true;
      break;
    }
  }
  const format = hasAlpha ? 'rgba4444' : 'rgb565';
  const palette = quantize(data, 256, { format, oneBitAlpha: hasAlpha });
  const index = applyPalette(data, palette, format);
  const gif = GIFEncoder();
  const transparentIndex = hasAlpha ? palette.findIndex((c) => c[3] === 0) : -1;
  gif.writeFrame(index, width, height, {
    palette,
    transparent: transparentIndex >= 0,
    transparentIndex: Math.max(0, transparentIndex),
  });
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

async function encodeTiff(canvas: HTMLCanvasElement): Promise<Blob> {
  const { default: UTIF } = await import('utif');
  const { width, height, data } = getImageData(canvas);
  const buf = UTIF.encodeImage(new Uint8Array(data.buffer), width, height);
  return new Blob([buf], { type: 'image/tiff' });
}

async function encodeAvif(canvas: HTMLCanvasElement, level: QualityLevel): Promise<Blob> {
  const { default: encode } = await import('@jsquash/avif/encode');
  const buf = await encode(getImageData(canvas), { quality: avifQuality[level], speed: 6 });
  return new Blob([buf], { type: 'image/avif' });
}

export async function encodeImage(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  level: QualityLevel
): Promise<Blob> {
  const info = outputFormatMap[format];
  switch (format) {
    case 'jpeg':
      return toBlob(flattenOnWhite(canvas), info.mime, lossyQuality[level]);
    case 'webp':
      return toBlob(canvas, info.mime, lossyQuality[level]);
    case 'png':
      return toBlob(canvas, info.mime);
    case 'avif':
      return encodeAvif(canvas, level);
    case 'gif':
      return encodeGif(canvas);
    case 'bmp':
      return encodeBmp(canvas);
    case 'tiff':
      return encodeTiff(canvas);
    case 'ico':
      return encodeIco(canvas);
  }
}
