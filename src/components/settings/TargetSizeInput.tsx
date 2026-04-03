interface Props {
  value: number;
  onChange: (size: number) => void;
}

export default function TargetSizeInput({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-600">
        目標ファイルサイズ
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={50}
          max={10000}
          step={50}
          value={value}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!isNaN(num) && num > 0) onChange(num);
          }}
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        <span className="text-sm text-gray-500">KB 以下</span>
      </div>
    </div>
  );
}
