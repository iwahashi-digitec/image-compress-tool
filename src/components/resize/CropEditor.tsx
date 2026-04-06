import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { CropPercent } from '../../lib/resizeImage';

interface Props {
  imageUrl: string;
  crop: Crop;
  onChange: (crop: Crop) => void;
  fileCount: number;
}

type PxField = 'x' | 'y' | 'w' | 'h';

export default function CropEditor({ imageUrl, crop, onChange, fileCount }: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // 画像読み込み時にデフォルト範囲（中央 90%）を設定
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      setNaturalSize({ w, h });
      onChange({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    },
    [onChange]
  );

  // imageUrl が切り替わったらサイズをリセット
  useEffect(() => {
    setNaturalSize(null);
  }, [imageUrl]);

  // % → px（表示用）
  const px = useMemo(() => {
    if (!naturalSize) return { x: 0, y: 0, w: 0, h: 0 };
    return {
      x: Math.round((crop.x / 100) * naturalSize.w),
      y: Math.round((crop.y / 100) * naturalSize.h),
      w: Math.round((crop.width / 100) * naturalSize.w),
      h: Math.round((crop.height / 100) * naturalSize.h),
    };
  }, [crop, naturalSize]);

  // px 入力 → % に変換して crop を更新
  const handlePxChange = useCallback(
    (field: PxField, value: string) => {
      if (!naturalSize) return;
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) return;

      const updated = { ...crop };
      switch (field) {
        case 'x':
          updated.x = Math.min((num / naturalSize.w) * 100, 100 - crop.width);
          break;
        case 'y':
          updated.y = Math.min((num / naturalSize.h) * 100, 100 - crop.height);
          break;
        case 'w': {
          const pct = (num / naturalSize.w) * 100;
          updated.width = Math.min(Math.max(pct, 0.1), 100 - crop.x);
          break;
        }
        case 'h': {
          const pct = (num / naturalSize.h) * 100;
          updated.height = Math.min(Math.max(pct, 0.1), 100 - crop.y);
          break;
        }
      }
      onChange(updated);
    },
    [crop, naturalSize, onChange]
  );

  const fields: { field: PxField; label: string; max: number | null }[] = [
    { field: 'x', label: 'X（左からの位置）', max: naturalSize?.w ?? null },
    { field: 'y', label: 'Y（上からの位置）', max: naturalSize?.h ?? null },
    { field: 'w', label: '幅',               max: naturalSize?.w ?? null },
    { field: 'h', label: '高さ',             max: naturalSize?.h ?? null },
  ];

  return (
    <div className="space-y-4">
      {/* インタラクティブ クロップ */}
      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 flex justify-center">
        <ReactCrop crop={crop} onChange={onChange} minWidth={1} minHeight={1}>
          <img
            src={imageUrl}
            onLoad={handleImageLoad}
            alt="トリミング対象"
            style={{ maxWidth: '100%', maxHeight: '400px', display: 'block' }}
          />
        </ReactCrop>
      </div>

      {/* 数値入力（画像読み込み後に表示） */}
      {naturalSize && (
        <div className="grid grid-cols-2 gap-3">
          {fields.map(({ field, label, max }) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1.5">
                {label} (px)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={px[field]}
                  min={field === 'w' || field === 'h' ? 1 : 0}
                  max={max ?? undefined}
                  onChange={(e) => handlePxChange(field, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                />
                {max != null && (
                  <span className="text-xs text-gray-400 shrink-0">/ {max}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 結果サイズ & 複数ファイル注記 */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>
          {naturalSize
            ? `トリミング後: ${px.w} × ${px.h} px`
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
  return {
    x: crop.unit === '%' ? crop.x : 0,
    y: crop.unit === '%' ? crop.y : 0,
    width: crop.unit === '%' ? crop.width : 100,
    height: crop.unit === '%' ? crop.height : 100,
  };
}
