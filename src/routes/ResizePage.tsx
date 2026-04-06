import { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, Unlock, ArrowRight, Info } from 'lucide-react';
import type { Crop } from 'react-image-crop';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile } from '../types';
import { generateId } from '../lib/fileUtils';
import { processImage, calcResizeDimensions, type ResizeOptions } from '../lib/resizeImage';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';
import CropEditor, { toCropPercent } from '../components/resize/CropEditor';

type OperationType = 'resize' | 'crop';

function addSuffix(filename: string, suffix: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0
    ? filename.substring(0, dot) + suffix + filename.substring(dot)
    : filename + suffix;
}

function loadNaturalSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ w: 0, h: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function ResizePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);

  // ── 操作タイプ ───────────────────────────────────────────
  const [opType, setOpType] = useState<OperationType>('resize');

  // ── リサイズ設定 ─────────────────────────────────────────
  const [widthStr, setWidthStr] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [firstImgSize, setFirstImgSize] = useState<{ w: number; h: number } | null>(null);

  // ── トリミング設定 ───────────────────────────────────────
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
  const firstImgUrl = useRef<string | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);

  // ── ファイル選択 ─────────────────────────────────────────
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(),
      file: f,
    }));
    setFiles(uploaded);
    setPhase('configure');

    // 最初のファイルの寸法・プレビューを取得
    const first = newFiles[0];
    const size = await loadNaturalSize(first);
    setFirstImgSize(size);

    if (firstImgUrl.current) URL.revokeObjectURL(firstImgUrl.current);
    const url = URL.createObjectURL(first);
    firstImgUrl.current = url;
    setCropPreviewUrl(url);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        setPhase('select');
        setFirstImgSize(null);
      }
      return next;
    });
  }, []);

  const handleAdd = useCallback(async (newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(),
      file: f,
    }));
    setFiles((prev) => [...prev, ...uploaded]);
  }, []);

  // コンポーネントアンマウント時に Object URL を解放
  useEffect(() => {
    return () => {
      if (firstImgUrl.current) URL.revokeObjectURL(firstImgUrl.current);
    };
  }, []);

  // ── リサイズのプレビュー計算 ─────────────────────────────
  const resizeOptions: ResizeOptions = {
    width: widthStr !== '' ? Number(widthStr) : undefined,
    height: heightStr !== '' ? Number(heightStr) : undefined,
    maintainAspect,
  };

  const previewDims =
    firstImgSize && firstImgSize.w > 0
      ? calcResizeDimensions(firstImgSize.w, firstImgSize.h, resizeOptions)
      : null;

  const hasResizeInput = widthStr !== '' || heightStr !== '';

  // ── 縦横比ロック時の自動補完 ─────────────────────────────
  const handleWidthChange = useCallback(
    (val: string) => {
      setWidthStr(val);
      if (maintainAspect && firstImgSize && firstImgSize.w > 0 && val !== '') {
        const w = Number(val);
        if (w > 0) {
          const h = Math.round((firstImgSize.h / firstImgSize.w) * w);
          setHeightStr(String(h));
        }
      }
    },
    [maintainAspect, firstImgSize]
  );

  const handleHeightChange = useCallback(
    (val: string) => {
      setHeightStr(val);
      if (maintainAspect && firstImgSize && firstImgSize.h > 0 && val !== '') {
        const h = Number(val);
        if (h > 0) {
          const w = Math.round((firstImgSize.w / firstImgSize.h) * h);
          setWidthStr(String(w));
        }
      }
    },
    [maintainAspect, firstImgSize]
  );

  const handleLockToggle = useCallback(() => {
    setMaintainAspect((v) => !v);
  }, []);

  // ── 処理実行 ─────────────────────────────────────────────
  const handleProcess = useCallback(async () => {
    setPhase('processing');

    const initial: ProcessingFile[] = files.map((f) => ({
      id: f.id,
      originalFile: f.file,
      status: 'pending' as const,
      progress: 0,
    }));
    setProcessing(initial);

    const cropPercent = opType === 'crop' ? toCropPercent(crop) : undefined;
    const resize = opType === 'resize' && hasResizeInput ? resizeOptions : undefined;

    const completed: ProcessedFile[] = [];

    for (const file of files) {
      setProcessing((prev) =>
        prev.map((p) => (p.id === file.id ? { ...p, status: 'processing' } : p))
      );

      try {
        const resultBlob = await processImage(
          file.file,
          { crop: cropPercent, resize },
          (progress) => {
            setProcessing((prev) =>
              prev.map((p) => (p.id === file.id ? { ...p, progress } : p))
            );
          }
        );

        setProcessing((prev) =>
          prev.map((p) => (p.id === file.id ? { ...p, status: 'done', progress: 100 } : p))
        );

        const suffix = opType === 'crop' ? '_cropped' : '_resized';
        completed.push({
          id: file.id,
          originalFile: file.file,
          resultBlob,
          resultFilename: addSuffix(file.file.name, suffix),
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
  }, [files, opType, crop, resizeOptions, hasResizeInput]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setPhase('select');
    setFirstImgSize(null);
    setWidthStr('');
    setHeightStr('');
  }, []);

  // ── 処理ボタンの有効条件 ─────────────────────────────────
  const canProcess =
    files.length > 0 &&
    (opType === 'crop' || (opType === 'resize' && hasResizeInput));

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-6">リサイズ & トリミング</h1>

        {/* ── ファイル選択 ── */}
        {phase === 'select' && (
          <DropZone mode="resize" onFilesSelected={handleFilesSelected} />
        )}

        {/* ── 設定 ── */}
        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList
              files={files}
              mode="resize"
              onRemove={handleRemove}
              onAdd={handleAdd}
            />

            {/* 操作タブ */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['resize', 'crop'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOpType(type)}
                  className={`
                    flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150
                    ${opType === type
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {type === 'resize' ? 'リサイズ' : 'トリミング'}
                </button>
              ))}
            </div>

            {/* リサイズ設定 */}
            {opType === 'resize' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  {/* 幅 */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">幅 (px)</label>
                    <input
                      type="number"
                      value={widthStr}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="例: 800"
                      min={1}
                      max={10000}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                    />
                  </div>

                  {/* 縦横比ロック */}
                  <div className="mt-5">
                    <button
                      onClick={handleLockToggle}
                      title={maintainAspect ? '縦横比を維持中（クリックで解除）' : '縦横比を維持しない（クリックで有効）'}
                      className={`
                        p-2 rounded-lg border transition-colors
                        ${maintainAspect
                          ? 'border-primary-300 bg-primary-50 text-primary-600'
                          : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                        }
                      `}
                    >
                      {maintainAspect ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </div>

                  {/* 高さ */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1.5">高さ (px)</label>
                    <input
                      type="number"
                      value={heightStr}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="例: 600"
                      min={1}
                      max={10000}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                    />
                  </div>
                </div>

                {/* 元サイズ & 変換後プレビュー */}
                {firstImgSize && firstImgSize.w > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
                    <span className="font-medium text-gray-600">
                      {firstImgSize.w} × {firstImgSize.h}
                    </span>
                    {previewDims && hasResizeInput && (
                      <>
                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-primary-600">
                          {previewDims.width} × {previewDims.height}
                        </span>
                        {!maintainAspect &&
                          widthStr !== '' &&
                          heightStr !== '' && (
                            <span className="text-xs text-amber-600 ml-1">（縦横比変更あり）</span>
                          )}
                      </>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">px</span>
                  </div>
                )}

                {/* 片方だけ入力の場合のヒント */}
                {!hasResizeInput && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Info size={12} />
                    幅・高さのどちらか一方だけの指定でも処理できます
                  </p>
                )}
              </div>
            )}

            {/* トリミング設定 */}
            {opType === 'crop' && cropPreviewUrl && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <CropEditor
                  imageUrl={cropPreviewUrl}
                  crop={crop}
                  onChange={setCrop}
                  fileCount={files.length}
                />
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!canProcess}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {opType === 'resize' ? 'リサイズする' : 'トリミングする'}
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
