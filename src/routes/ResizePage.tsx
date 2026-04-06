import { useState, useCallback, useEffect, useRef } from 'react';
import type { Crop } from 'react-image-crop';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile } from '../types';
import { generateId } from '../lib/fileUtils';
import { processImage } from '../lib/resizeImage';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';
import CropEditor, { toCropPercent } from '../components/resize/CropEditor';

function addSuffix(filename: string, suffix: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0
    ? filename.substring(0, dot) + suffix + filename.substring(dot)
    : filename + suffix;
}

export default function ResizePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);

  // 出力サイズ（入力欄）
  const [outputWidthStr, setOutputWidthStr] = useState('');
  const [outputHeightStr, setOutputHeightStr] = useState('');

  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
  const firstImgUrl = useRef<string | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);

  // 両方入力されたときだけアスペクト比を固定
  const outputW = outputWidthStr !== '' ? Number(outputWidthStr) : null;
  const outputH = outputHeightStr !== '' ? Number(outputHeightStr) : null;
  const aspect = outputW && outputH && outputW > 0 && outputH > 0
    ? outputW / outputH
    : undefined;

  // ── ファイル選択 ──────────────────────────────────────────
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(),
      file: f,
    }));
    setFiles(uploaded);
    setPhase('configure');

    if (firstImgUrl.current) URL.revokeObjectURL(firstImgUrl.current);
    const url = URL.createObjectURL(newFiles[0]);
    firstImgUrl.current = url;
    setCropPreviewUrl(url);
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

  useEffect(() => {
    return () => {
      if (firstImgUrl.current) URL.revokeObjectURL(firstImgUrl.current);
    };
  }, []);

  // ── 処理実行 ──────────────────────────────────────────────
  const handleProcess = useCallback(async () => {
    setPhase('processing');

    const initial: ProcessingFile[] = files.map((f) => ({
      id: f.id,
      originalFile: f.file,
      status: 'pending' as const,
      progress: 0,
    }));
    setProcessing(initial);

    const cropPercent = toCropPercent(crop);
    const outputSize =
      outputW && outputH && outputW > 0 && outputH > 0
        ? { width: outputW, height: outputH }
        : undefined;

    const completed: ProcessedFile[] = [];

    for (const file of files) {
      setProcessing((prev) =>
        prev.map((p) => (p.id === file.id ? { ...p, status: 'processing' } : p))
      );

      try {
        const resultBlob = await processImage(
          file.file,
          { crop: cropPercent, outputSize },
          (progress) => {
            setProcessing((prev) =>
              prev.map((p) => (p.id === file.id ? { ...p, progress } : p))
            );
          }
        );

        setProcessing((prev) =>
          prev.map((p) => (p.id === file.id ? { ...p, status: 'done', progress: 100 } : p))
        );

        completed.push({
          id: file.id,
          originalFile: file.file,
          resultBlob,
          resultFilename: addSuffix(file.file.name, '_cropped'),
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
  }, [files, crop, outputW, outputH]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setPhase('select');
    setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
  }, []);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-6">トリミング</h1>

        {phase === 'select' && (
          <DropZone mode="resize" onFilesSelected={handleFilesSelected} />
        )}

        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList
              files={files}
              mode="resize"
              onRemove={handleRemove}
              onAdd={handleAdd}
            />

            {/* 出力サイズ入力 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">出力サイズ（px）</p>
                <p className="text-xs text-gray-400">
                  入力するとアスペクト比が固定され、縦横比に合った枠でトリミングできます
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1.5">幅</label>
                  <input
                    type="number"
                    value={outputWidthStr}
                    onChange={(e) => setOutputWidthStr(e.target.value)}
                    placeholder="例: 1800"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                  />
                </div>
                <span className="mt-5 text-gray-400 text-sm">×</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1.5">高さ</label>
                  <input
                    type="number"
                    value={outputHeightStr}
                    onChange={(e) => setOutputHeightStr(e.target.value)}
                    placeholder="例: 945"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                  />
                </div>
                <div className="mt-5 text-xs text-gray-400 shrink-0">px</div>
              </div>

              {aspect && (
                <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-1.5">
                  アスペクト比 {outputW} : {outputH} に固定中 — 枠を動かして位置と大きさを調整してください
                </p>
              )}
            </div>

            {/* クロップエディタ */}
            {cropPreviewUrl && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <CropEditor
                  imageUrl={cropPreviewUrl}
                  crop={crop}
                  onChange={setCrop}
                  aspect={aspect}
                  fileCount={files.length}
                />
              </div>
            )}

            <button
              onClick={handleProcess}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base"
            >
              {outputW && outputH
                ? `${outputW} × ${outputH} px でトリミングする`
                : 'トリミングする'}
            </button>
          </div>
        )}

        {phase === 'processing' && <ProcessingView files={processing} />}

        {phase === 'complete' && (
          <ResultsView files={results} onReset={handleReset} />
        )}
      </div>
    </PageLayout>
  );
}
