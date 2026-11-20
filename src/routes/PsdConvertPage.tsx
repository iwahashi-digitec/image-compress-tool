import { useState, useCallback } from 'react';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile, QualityLevel } from '../types';
import { generateId, changeExtension } from '../lib/fileUtils';
import { convertPsd, type PsdOutputFormat } from '../lib/convertPsd';
import { usePersistedQuality } from '../hooks/usePersistedSettings';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import QualitySelector from '../components/settings/QualitySelector';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';

const qualityOptions: { key: QualityLevel; label: string; description: string }[] = [
  { key: 'high-compression', label: '軽量優先', description: 'ファイルサイズ小。画質は落ちる' },
  { key: 'recommended',      label: '推奨',     description: '画質とサイズのバランスが良い' },
  { key: 'low-compression',  label: '高画質優先', description: '高画質を維持' },
];

export default function PsdConvertPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormat] = useState<PsdOutputFormat>('jpeg');
  const [quality, setQuality] = usePersistedQuality('psd-convert');
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const uploaded = newFiles.map((f) => ({ id: generateId(), file: f }));
    setFiles((prev) => [...prev, ...uploaded]);
    setPhase('configure');
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) setPhase('select');
      return next;
    });
  }, []);

  const handleAdd = useCallback((newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ id: generateId(), file: f })),
    ]);
  }, []);

  const handleProcess = useCallback(async () => {
    setPhase('processing');
    const initial: ProcessingFile[] = files.map((f) => ({
      id: f.id,
      originalFile: f.file,
      status: 'pending' as const,
      progress: 0,
    }));
    setProcessing(initial);

    const completed: ProcessedFile[] = [];

    for (const file of files) {
      setProcessing((prev) =>
        prev.map((p) => (p.id === file.id ? { ...p, status: 'processing' } : p))
      );

      try {
        const resultBlob = await convertPsd(file.file, format, quality, (progress) => {
          setProcessing((prev) =>
            prev.map((p) => (p.id === file.id ? { ...p, progress } : p))
          );
        });

        setProcessing((prev) =>
          prev.map((p) => (p.id === file.id ? { ...p, status: 'done', progress: 100 } : p))
        );

        const ext = format === 'jpeg' ? 'jpg' : 'png';
        completed.push({
          id: file.id,
          originalFile: file.file,
          resultBlob,
          resultFilename: changeExtension(file.file.name, ext),
          originalSize: file.file.size,
          resultSize: resultBlob.size,
        });
      } catch (err) {
        setProcessing((prev) =>
          prev.map((p) =>
            p.id === file.id
              ? { ...p, status: 'error', progress: 100, error: (err as Error).message }
              : p
          )
        );
      }
    }

    setResults(completed);
    setTimeout(() => setPhase('complete'), 600);
  }, [files, format, quality]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setPhase('select');
  }, []);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-6">PSDをJPG / PNGに変換</h1>

        {phase === 'select' && (
          <DropZone mode="psd-convert" onFilesSelected={handleFilesSelected} />
        )}

        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList files={files} mode="psd-convert" onRemove={handleRemove} onAdd={handleAdd} />

            {/* 出力フォーマット選択 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-medium text-gray-700">出力フォーマット</p>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {(['jpeg', 'png'] as PsdOutputFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors
                      ${format === f
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {f === 'jpeg' ? 'JPG' : 'PNG'}
                  </button>
                ))}
              </div>
              {format === 'png' && (
                <p className="text-xs text-gray-400">
                  PNG は可逆圧縮のため画質は劣化しません。ファイルサイズは大きくなる場合があります。
                </p>
              )}
            </div>

            {/* JPG のみ品質選択を表示 */}
            {format === 'jpeg' && (
              <QualitySelector options={qualityOptions} value={quality} onChange={setQuality} />
            )}

            <button
              type="button"
              onClick={handleProcess}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base"
            >
              {format === 'jpeg' ? 'JPGに変換' : 'PNGに変換'}
            </button>
          </div>
        )}

        {phase === 'processing' && <ProcessingView files={processing} />}
        {phase === 'complete' && <ResultsView files={results} onReset={handleReset} />}
      </div>
    </PageLayout>
  );
}
