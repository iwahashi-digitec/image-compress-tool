import { AlertTriangle } from 'lucide-react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WebpUnsupportedDialog({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base leading-snug">
              このブラウザはWebP変換に非対応です
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              代わりに圧縮JPEGを作成しますか？
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600
              font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            いいえ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white
              font-medium text-sm hover:bg-primary-700 transition-colors"
          >
            はい
          </button>
        </div>
      </div>
    </div>
  );
}
