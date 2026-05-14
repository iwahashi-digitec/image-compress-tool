import { useState, useCallback, useEffect, useRef } from 'react';
import type { Crop } from 'react-image-crop';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile } from '../types';
import type { CropFormat } from '../constants/cropFormats';
import { generateId } from '../lib/fileUtils';
import { processImage } from '../lib/resizeImage';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';
import CropEditor, { toCropPercent } from '../components/resize/CropEditor';
import FormatSelector from '../components/resize/FormatSelector';

type CropMode = 'manual' | 'format';

function addSuffix(filename: string, suffix: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0
    ? filename.substring(0, dot) + suffix + filename.substring(dot)
    : filename + suffix;
}

function LockClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}

export default function ResizePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);

  const [cropMode, setCropMode] = useState<CropMode>('manual');

  // Manual mode
  const [outputWidthStr, setOutputWidthStr] = useState('');
  const [outputHeightStr, setOutputHeightStr] = useState('');
  const [aspectLocked, setAspectLocked] = useState(false);

  // Format mode
  const [selectedFormat, setSelectedFormat] = useState<CropFormat | null>(null);

  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const firstImgUrl = useRef<string | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);

  const outputW = outputWidthStr !== '' ? Number(outputWidthStr) : null;
  const outputH = outputHeightStr !== '' ? Number(outputHeightStr) : null;

  // Effective aspect for CropEditor
  // W・H両方入力されていれば常にその比率を適用。🔗ON時は元画像比率でクロップ枠も固定。
  const naturalRatio = imageNaturalSize ? imageNaturalSize.w / imageNaturalSize.h : undefined;
  const aspect: number | undefined = cropMode === 'format'
    ? (selectedFormat ? selectedFormat.width / selectedFormat.height : undefined)
    : (outputW && outputH && outputW > 0 && outputH > 0
        ? outputW / outputH
        : (aspectLocked ? naturalRatio : undefined));

  // Output size passed to processImage
  const outputSize =
    cropMode === 'format'
      ? (selectedFormat ? { width: selectedFormat.width, height: selectedFormat.height } : undefined)
      : (outputW && outputH && outputW > 0 && outputH > 0 ? { width: outputW, height: outputH } : undefined);

  const handleToggleLock = useCallback(() => {
    if (aspectLocked) {
      setAspectLocked(false);
    } else {
      setAspectLocked(true);
      // ロック ON 時：片方だけ入力済みならもう一方を自動計算
      if (imageNaturalSize) {
        const ratio = imageNaturalSize.w / imageNaturalSize.h;
        if (outputW && outputW > 0 && !outputH) {
          setOutputHeightStr(String(Math.round(outputW / ratio)));
        } else if (outputH && outputH > 0 && !outputW) {
          setOutputWidthStr(String(Math.round(outputH * ratio)));
        }
      }
    }
  }, [aspectLocked, imageNaturalSize, outputW, outputH]);

  const handleWidthChange = useCallback((val: string) => {
    setOutputWidthStr(val);
    if (aspectLocked && imageNaturalSize) {
      const w = parseFloat(val);
      if (w > 0) {
        setOutputHeightStr(String(Math.round(w / (imageNaturalSize.w / imageNaturalSize.h))));
      } else if (val === '') {
        setOutputHeightStr('');
      }
    }
  }, [aspectLocked, imageNaturalSize]);

  const handleHeightChange = useCallback((val: string) => {
    setOutputHeightStr(val);
    if (aspectLocked && imageNaturalSize) {
      const h = parseFloat(val);
      if (h > 0) {
        setOutputWidthStr(String(Math.round(h * (imageNaturalSize.w / imageNaturalSize.h))));
      } else if (val === '') {
        setOutputWidthStr('');
      }
    }
  }, [aspectLocked, imageNaturalSize]);

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

  const handleModeChange = useCallback((mode: CropMode) => {
    setCropMode(mode);
    if (mode === 'manual') setSelectedFormat(null);
  }, []);

  const handleFormatSelect = useCallback((format: CropFormat | null) => {
    setSelectedFormat(format);
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

    const cropPercent = toCropPercent(crop);
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
  }, [files, crop, outputSize]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setPhase('select');
    setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    setCropMode('manual');
    setSelectedFormat(null);
    setAspectLocked(false);
    setOutputWidthStr('');
    setOutputHeightStr('');
  }, []);

  const canExecute = cropMode === 'format' ? selectedFormat !== null : true;

  const executeLabel =
    cropMode === 'format'
      ? (selectedFormat
          ? `${selectedFormat.name}（${selectedFormat.width} × ${selectedFormat.height} px）でトリミング`
          : 'フォーマットを選択してください')
      : (outputSize
          ? `${outputSize.width} × ${outputSize.height} px でトリミングする`
          : 'トリミングする');

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

            {/* モード切替タブ */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleModeChange('manual')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors
                  ${cropMode === 'manual'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                手動でトリミング
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('format')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors
                  ${cropMode === 'format'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                フォーマットでトリミング
              </button>
            </div>

            {/* 手動モード: 出力サイズ + 🔗 */}
            {cropMode === 'manual' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">出力サイズ（px）</p>
                  <p className="text-xs text-gray-400">
                    入力するとそのサイズで書き出されます。未入力の場合は選択範囲のピクセル数で書き出します
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">幅</label>
                    <input
                      type="number"
                      value={outputWidthStr}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="例: 1800"
                      min={1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                    />
                  </div>

                  {/* 縦横比ロックボタン */}
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    title={aspectLocked ? '比率ロックを解除' : '縦横比を固定する'}
                    className={`mb-0.5 p-2 rounded-lg border transition-colors
                      ${aspectLocked
                        ? 'border-primary-400 bg-primary-50 text-primary-600 hover:bg-primary-100'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50'}`}
                  >
                    {aspectLocked ? <LockClosedIcon /> : <LockOpenIcon />}
                  </button>

                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">高さ</label>
                    <input
                      type="number"
                      value={outputHeightStr}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="例: 945"
                      min={1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                    />
                  </div>
                  <div className="mb-2 text-xs text-gray-400 shrink-0">px</div>
                </div>

                {aspectLocked && imageNaturalSize && (
                  <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-1.5">
                    元画像の比率（{imageNaturalSize.w} : {imageNaturalSize.h}）に連動中 — 幅か高さを入力するともう一方が自動計算されます
                  </p>
                )}
                {!aspectLocked && outputW && outputH && (
                  <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-1.5">
                    比率 {outputW} : {outputH} に固定中 — 枠を動かして位置と大きさを調整してください
                  </p>
                )}
              </div>
            )}

            {/* フォーマットモード: フォーマット選択 */}
            {cropMode === 'format' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-medium text-gray-700">フォーマットを選択</p>
                <FormatSelector
                  selectedId={selectedFormat?.id ?? null}
                  onSelect={handleFormatSelect}
                />
              </div>
            )}

            {/* クロップエディタ */}
            {cropPreviewUrl && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <CropEditor
                  imageUrl={cropPreviewUrl}
                  crop={crop}
                  onChange={setCrop}
                  aspect={aspect}
                  fileCount={files.length}
                  onImageLoad={setImageNaturalSize}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleProcess}
              disabled={!canExecute}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executeLabel}
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
