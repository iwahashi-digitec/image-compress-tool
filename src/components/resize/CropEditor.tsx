import { useCallback, useEffect, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { CropPercent } from '../../lib/resizeImage';

interface Props {
  imageUrl: string;
  crop: Crop;
  onChange: (crop: Crop) => void;
  /** 出力幅÷高さのアスペクト比。指定時はクロップ枠がその比率に固定される */
  aspect?: number;
  fileCount: number;
  onImageLoad?: (size: { w: number; h: number }) => void;
}

export default function CropEditor({ imageUrl, crop, onChange, aspect, fileCount, onImageLoad }: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      setNaturalSize({ w, h });
      onImageLoad?.({ w, h });

      // アスペクト比が指定されている場合は中央にフィットするデフォルト枠を設定
      if (aspect) {
        const imageAspect = w / h;
        let cropW: number;
        let cropH: number;
        if (aspect > imageAspect) {
          // 横に合わせる
          cropW = 90;
          cropH = (w * 0.9) / aspect / h * 100;
        } else {
          // 縦に合わせる
          cropH = 90;
          cropW = (h * 0.9) * aspect / w * 100;
        }
        const x = (100 - cropW) / 2;
        const y = (100 - cropH) / 2;
        onChange({ unit: '%', x, y, width: cropW, height: cropH });
      } else {
        onChange({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
      }
    },
    [aspect, onChange]
  );

  useEffect(() => {
    setNaturalSize(null);
  }, [imageUrl]);

  // aspect が変わったとき（画像読み込み済みなら）枠を再計算
  useEffect(() => {
    if (!naturalSize) return;
    const { w, h } = naturalSize;
    if (aspect) {
      const imageAspect = w / h;
      let cropW: number;
      let cropH: number;
      if (aspect > imageAspect) {
        cropW = 90;
        cropH = (w * 0.9) / aspect / h * 100;
      } else {
        cropH = 90;
        cropW = (h * 0.9) * aspect / w * 100;
      }
      const x = (100 - cropW) / 2;
      const y = (100 - cropH) / 2;
      onChange({ unit: '%', x, y, width: cropW, height: cropH });
    } else {
      onChange({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    }
  // naturalSize は参照比較なので w/h を依存に入れる
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, naturalSize?.w, naturalSize?.h]);

  // 現在の枠が実際に何px分をキャプチャしているか（元画像上のサイズ）
  const captureW = naturalSize ? Math.round((crop.width / 100) * naturalSize.w) : null;
  const captureH = naturalSize ? Math.round((crop.height / 100) * naturalSize.h) : null;

  return (
    <div className="space-y-3">
      {/* インタラクティブ クロップ */}
      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={(_px, pct) => onChange(pct)}
          aspect={aspect}
          minWidth={1}
          minHeight={1}
        >
          <img
            src={imageUrl}
            onLoad={handleImageLoad}
            alt="トリミング対象"
            style={{ maxWidth: '100%', maxHeight: '420px', display: 'block' }}
          />
        </ReactCrop>
      </div>

      {/* キャプチャサイズ & 複数ファイル注記 */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span className="text-xs text-gray-400">
          {captureW != null && captureH != null
            ? `元画像の選択範囲: ${captureW} × ${captureH} px`
            : '画像を読み込んでいます...'}
        </span>
        {fileCount > 1 && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {fileCount}枚すべてに同じ割合を適用
          </span>
        )}
      </div>
    </div>
  );
}

/** Crop（%単位）を CropPercent 形式に変換するヘルパー */
export function toCropPercent(crop: Crop): CropPercent {
  if (crop.unit !== '%') throw new Error('crop は % 単位である必要があります');
  return { x: crop.x, y: crop.y, width: crop.width, height: crop.height };
}
