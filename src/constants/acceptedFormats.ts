import type { FeatureMode } from '../types';

export const acceptedMimeTypes: Record<FeatureMode, string[]> = {
  compress: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  'compress-and-webp': [
    'image/jpeg',
  ],
  resize: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  // HEIC / TIFF などは OS によって MIME タイプが空になるため、拡張子でも判定する
  'image-convert': [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/avif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/tiff',
    'image/heic',
    'image/heif',
    'application/postscript',
    'application/eps',
    'application/illustrator',
    'image/x-eps',
  ],
};

export const acceptedExtensions: Record<FeatureMode, string> = {
  compress: '.jpg,.jpeg,.png,.webp,.pdf',
  'compress-and-webp': '.jpg,.jpeg',
  resize: '.jpg,.jpeg,.png,.webp',
  'image-convert': '.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg,.ico,.tif,.tiff,.heic,.heif,.psd,.ai,.eps',
};

export const formatLabels: Record<FeatureMode, string> = {
  compress: 'JPEG / PNG / WebP / PDF',
  'compress-and-webp': 'JPEG',
  resize: 'JPEG / PNG / WebP',
  'image-convert': 'JPEG / PNG / WebP / GIF / BMP / AVIF / SVG / ICO / TIFF / HEIC / PSD / AI / EPS',
};
