import type { FeatureMode } from '../types';

export const acceptedMimeTypes: Record<FeatureMode, string[]> = {
  compress: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  'webp-convert': [
    'image/jpeg',
    'image/png',
  ],
  'compress-and-webp': [
    'image/jpeg',
  ],
  resize: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  // PSD は OS によって MIME タイプが異なるため、拡張子でも判定する
  'psd-convert': [
    'image/vnd.adobe.photoshop',
    'application/photoshop',
    'application/psd',
    'application/x-photoshop',
    'application/octet-stream',
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
  'webp-convert': '.jpg,.jpeg,.png',
  'compress-and-webp': '.jpg,.jpeg',
  resize: '.jpg,.jpeg,.png,.webp',
  'psd-convert': '.psd',
  'image-convert': '.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg,.ico,.tif,.tiff,.heic,.heif,.psd,.ai,.eps',
};

export const formatLabels: Record<FeatureMode, string> = {
  compress: 'JPEG / PNG / WebP / PDF',
  'webp-convert': 'JPEG / PNG',
  'compress-and-webp': 'JPEG',
  resize: 'JPEG / PNG / WebP',
  'psd-convert': 'PSD（Photoshop）',
  'image-convert': 'JPEG / PNG / WebP / GIF / BMP / AVIF / SVG / ICO / TIFF / HEIC / PSD / AI / EPS',
};
