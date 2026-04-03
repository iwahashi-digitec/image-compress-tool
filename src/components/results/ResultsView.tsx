import { Download, CheckCircle2, RotateCcw, FileText } from 'lucide-react';
import type { ProcessedFile } from '../../types';
import SizeComparison from './SizeComparison';
import { downloadBlob, createZip } from '../../lib/zipUtils';
import { isImageFile } from '../../lib/fileUtils';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ResultThumb({ file }: { file: ProcessedFile }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (file.resultBlob.type.startsWith('image/')) {
      const url = URL.createObjectURL(file.resultBlob);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (isImageFile(file.originalFile)) {
      const url = URL.createObjectURL(file.originalFile);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (src) {
    return <img src={src} alt="" className="w-12 h-12 object-cover rounded-lg" />;
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
      <FileText size={20} className="text-red-400" />
    </div>
  );
}

interface Props {
  files: ProcessedFile[];
  onReset: () => void;
}

export default function ResultsView({ files, onReset }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSingle = useCallback((f: ProcessedFile) => {
    downloadBlob(f.resultBlob, f.resultFilename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    setDownloading(true);
    try {
      const zipBlob = await createZip(files);
      downloadBlob(zipBlob, '処理済みファイル.zip');
    } finally {
      setDownloading(false);
    }
  }, [files]);

  const totalOriginal = files.reduce((s, f) => s + f.originalSize, 0);
  const totalResult = files.reduce((s, f) => s + f.resultSize, 0);
  const totalReduction = totalOriginal > 0
    ? Math.round(((totalOriginal - totalResult) / totalOriginal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-success-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-800">処理完了</h2>
        {files.length > 1 && (
          <p className="text-sm text-gray-500 mt-1">
            {files.length}件のファイルで合計
            <span className="font-bold text-success-600 mx-1">-{totalReduction}%</span>
            削減
          </p>
        )}
      </div>

      <div className="space-y-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <ResultThumb file={f} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate mb-2">
                  {f.resultFilename}
                </p>
                <SizeComparison
                  originalSize={f.originalSize}
                  resultSize={f.resultSize}
                  intermediateSize={f.intermediateSize}
                />
              </div>
              <button
                onClick={() => handleDownloadSingle(f)}
                className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="ダウンロード"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {files.length > 1 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="w-full max-w-sm py-3 px-6 bg-primary-600 text-white rounded-xl
              font-medium hover:bg-primary-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {downloading ? 'ZIP作成中...' : 'すべてダウンロード (ZIP)'}
          </button>
        )}
        {files.length === 1 && (
          <button
            onClick={() => handleDownloadSingle(files[0])}
            className="w-full max-w-sm py-3 px-6 bg-primary-600 text-white rounded-xl
              font-medium hover:bg-primary-700 transition-colors
              flex items-center justify-center gap-2"
          >
            <Download size={18} />
            ダウンロード
          </button>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw size={14} />
            続けて処理する
          </button>
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
