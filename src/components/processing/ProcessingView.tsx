import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import type { ProcessingFile } from '../../types';
import ProgressBar from './ProgressBar';
import { isImageFile } from '../../lib/fileUtils';
import { useEffect, useState } from 'react';

function FileThumb({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (src) {
    return <img src={src} alt="" className="w-10 h-10 object-cover rounded-lg" />;
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
      <FileText size={18} className="text-red-400" />
    </div>
  );
}

interface Props {
  files: ProcessingFile[];
  showSteps?: boolean;
}

export default function ProcessingView({ files, showSteps }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Loader2 size={40} className="mx-auto text-primary-500 animate-spin mb-3" />
        <p className="text-lg font-medium text-gray-700">処理中...</p>
      </div>

      <div className="space-y-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <FileThumb file={f.originalFile} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {f.originalFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {showSteps && f.currentStep
                    ? f.currentStep === 1
                      ? 'STEP 1: 圧縮中...'
                      : 'STEP 2: WebP変換中...'
                    : f.status === 'done'
                    ? '完了'
                    : f.status === 'error'
                    ? f.error || 'エラー'
                    : f.status === 'processing'
                    ? '処理中...'
                    : '待機中'}
                </p>
              </div>
              <div className="flex-shrink-0">
                {f.status === 'done' ? (
                  <CheckCircle2 size={20} className="text-success-500" />
                ) : f.status === 'error' ? (
                  <AlertCircle size={20} className="text-danger-500" />
                ) : (
                  <span className="text-xs text-gray-400 font-mono">
                    {Math.round(f.progress)}%
                  </span>
                )}
              </div>
            </div>
            <ProgressBar
              progress={f.progress}
              className={
                f.status === 'done'
                  ? '[&>div]:bg-success-500'
                  : f.status === 'error'
                  ? '[&>div]:bg-danger-500'
                  : ''
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
