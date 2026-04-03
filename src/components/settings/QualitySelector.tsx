import { Check } from 'lucide-react';
import type { QualityLevel } from '../../types';

interface PresetOption {
  key: QualityLevel;
  label: string;
  description: string;
}

interface Props {
  options: PresetOption[];
  value: QualityLevel;
  onChange: (level: QualityLevel) => void;
}

export default function QualitySelector({ options, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-600">品質設定</label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.key;
          const isRecommended = opt.key === 'recommended';

          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={`
                relative rounded-xl border-2 px-4 py-3 text-left transition-all duration-150
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-3 text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                  おすすめ
                </span>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-primary-700' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </span>
                {isSelected && (
                  <Check size={16} className="text-primary-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
