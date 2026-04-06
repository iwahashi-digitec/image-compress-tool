import { useCallback, useEffect, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { CropPercent } from '../../lib/resizeImage';

interface Props {
  imageUrl: string;
  crop: Crop;
  onChange: (crop: Crop) => void;
  fileCount: number;
}

export default function CropEditor({ imageUrl, crop, onChange, fileCount }: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // 画像読み込み時にデフォルト範囲（中央 90%）を設定
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      setNaturalSize({ w, h });
      onChange({
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90,
      });
    },
    [onChange]
  );

  // imageUrl が切り替わったらサイズをリセット
  useEffect(() => {
    setNaturalSize(null);
  }, [imageUrl]);

  // トリミング後の寸法をピクセル単位で表示
  const cropW = naturalSize ? Math.round((crop.width / 100) * naturalSize.w) : null;
  const cropH = naturalSize ? Math.round((crop.height / 100) * naturalSize.h) : null;

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={onChange}
          minWidth={5}
          minHeight={5}
        >
          <img
            src={imageUrl}
            onLoad={handleImageLoad}
            alt="トリミング対象"
            style={{ maxWidth: '100%', maxHeight: '420px', display: 'block' }}
          />
        </ReactCrop>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>
          {cropW != null && cropH != null
            ? `トリミング後: ${cropW} × ${cropH} px`
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
