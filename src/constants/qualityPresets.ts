import type { QualityLevel } from '../types';

export interface CompressionPreset {
  maxSizeMB: number;
  quality: number;
  label: string;
  description: string;
}

export interface WebpPreset {
  quality: number;
  label: string;
  description: string;
}

export const compressionPresets: Record<QualityLevel, CompressionPreset> = {
  'high-compression': {
    maxSizeMB: 0.5,
    quality: 0.4,
    label: '高圧縮',
    description: 'ファイルサイズ最小。画質は落ちる',
  },
  recommended: {
    maxSizeMB: 2,
    quality: 0.7,
    label: '推奨',
    description: '画質とサイズのバランスが良い',
  },
  'low-compression': {
    maxSizeMB: 10,
    quality: 0.9,
    label: '低圧縮',
    description: '高画質を維持。サイズ削減は控えめ',
  },
};

export const webpPresets: Record<QualityLevel, WebpPreset> = {
  'high-compression': {
    quality: 0.5,
    label: '軽量優先',
    description: 'ファイルサイズ最小。画質は落ちる',
  },
  recommended: {
    quality: 0.75,
    label: '推奨',
    description: '画質とサイズのバランスが良い',
  },
  'low-compression': {
    quality: 0.9,
    label: '高画質優先',
    description: '高画質を維持。サイズ削減は控えめ',
  },
};
