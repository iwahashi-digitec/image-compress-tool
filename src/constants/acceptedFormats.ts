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
};

export const acceptedExtensions: Record<FeatureMode, string> = {
  compress: '.jpg,.jpeg,.png,.webp,.pdf',
  'webp-convert': '.jpg,.jpeg,.png',
  'compress-and-webp': '.jpg,.jpeg',
};

export const formatLabels: Record<FeatureMode, string> = {
  compress: 'JPEG / PNG / WebP / PDF',
  'webp-convert': 'JPEG / PNG',
  'compress-and-webp': 'JPEG',
};
