import type { QualityLevel } from '../types';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'bmp' | 'tiff' | 'ico';

export interface OutputFormatInfo {
  id: OutputFormat;
  label: string;
  ext: string;
  mime: string;
  /** 品質設定（非可逆圧縮）が使えるか */
  lossy: boolean;
  /** 透過を保持できるか */
  alpha: boolean;
  note: string;
}

export const outputFormats: OutputFormatInfo[] = [
  { id: 'jpeg', label: 'JPG',  ext: 'jpg',  mime: 'image/jpeg', lossy: true,  alpha: false, note: '写真向け。最も汎用的。透過部分は白になります' },
  { id: 'png',  label: 'PNG',  ext: 'png',  mime: 'image/png',  lossy: false, alpha: true,  note: '劣化なし・透過対応。ロゴやスクリーンショット向け' },
  { id: 'webp', label: 'WebP', ext: 'webp', mime: 'image/webp', lossy: true,  alpha: true,  note: 'Web向けの軽量形式。透過対応' },
  { id: 'avif', label: 'AVIF', ext: 'avif', mime: 'image/avif', lossy: true,  alpha: true,  note: 'WebPよりさらに軽量。変換に時間がかかります' },
  { id: 'gif',  label: 'GIF',  ext: 'gif',  mime: 'image/gif',  lossy: false, alpha: true,  note: '256色に減色されます（アニメーションは1枚目のみ）' },
  { id: 'bmp',  label: 'BMP',  ext: 'bmp',  mime: 'image/bmp',  lossy: false, alpha: false, note: '無圧縮。ファイルサイズが大きくなります' },
  { id: 'tiff', label: 'TIFF', ext: 'tif',  mime: 'image/tiff', lossy: false, alpha: true,  note: '印刷・入稿向け。無圧縮のため大きくなります' },
  { id: 'ico',  label: 'ICO',  ext: 'ico',  mime: 'image/x-icon', lossy: false, alpha: true, note: 'ファビコン用。最大256×256pxに縮小されます' },
];

export const outputFormatMap: Record<OutputFormat, OutputFormatInfo> = Object.fromEntries(
  outputFormats.map((f) => [f.id, f])
) as Record<OutputFormat, OutputFormatInfo>;

/** JPEG / WebP 用（0〜1） */
export const lossyQuality: Record<QualityLevel, number> = {
  'high-compression': 0.6,
  recommended: 0.82,
  'low-compression': 0.95,
};

/** AVIF 用（0〜100） */
export const avifQuality: Record<QualityLevel, number> = {
  'high-compression': 40,
  recommended: 60,
  'low-compression': 80,
};

export const convertQualityOptions: { key: QualityLevel; label: string; description: string }[] = [
  { key: 'high-compression', label: '軽量優先',   description: 'ファイルサイズ小。画質は落ちる' },
  { key: 'recommended',      label: '推奨',       description: '画質とサイズのバランスが良い' },
  { key: 'low-compression',  label: '高画質優先', description: '高画質を維持。サイズは大きめ' },
];
