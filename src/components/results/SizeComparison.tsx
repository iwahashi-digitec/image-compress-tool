import { ArrowRight } from 'lucide-react';
import { formatFileSize, getReductionPercent } from '../../lib/fileUtils';

interface Props {
  originalSize: number;
  resultSize: number;
  intermediateSize?: number;
}

export default function SizeComparison({
  originalSize,
  resultSize,
  intermediateSize,
}: Props) {
  const totalReduction = getReductionPercent(originalSize, resultSize);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <SizeBadge label="元" size={originalSize} />

        {intermediateSize !== undefined && (
          <>
            <ArrowRight size={14} className="text-gray-300" />
            <SizeBadge label="圧縮後" size={intermediateSize} />
          </>
        )}

        <ArrowRight size={14} className="text-gray-300" />
        <SizeBadge label={intermediateSize !== undefined ? 'WebP' : '圧縮後'} size={resultSize} variant="result" />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-success-500 rounded-full transition-all duration-500"
            style={{ width: `${100 - totalReduction}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${totalReduction > 0 ? 'text-success-600' : 'text-gray-500'}`}>
          {totalReduction > 0 ? `-${totalReduction}%` : '0%'}
        </span>
      </div>
    </div>
  );
}

function SizeBadge({
  label,
  size,
  variant = 'default',
}: {
  label: string;
  size: number;
  variant?: 'default' | 'result';
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
        variant === 'result'
          ? 'bg-success-50 text-success-600 font-semibold'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      <span className="text-gray-400">{label}</span>
      <span className="font-mono">{formatFileSize(size)}</span>
    </div>
  );
}
