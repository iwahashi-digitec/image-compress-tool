import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile } from '../types';
import { generateId, changeExtension } from '../lib/fileUtils';
import { decodeImage, isVectorFile } from '../lib/decodeImage';
import { encodeImage } from '../lib/encodeImage';
import {
  type OutputFormat,
  outputFormats,
  outputFormatMap,
  convertQualityOptions,
} from '../constants/outputFormats';
import { usePersistedQuality } from '../hooks/usePersistedSettings';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import QualitySelector from '../components/settings/QualitySelector';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';

const FORMAT_KEY = 'image_convert_format';
const SCALE_KEY = 'image_convert_vector_scale';
const SCALE_OPTIONS = [1, 2, 3, 4] as const;

function loadScale(): number {
  try {
    const n = Number(localStorage.getItem(SCALE_KEY));
    if ((SCALE_OPTIONS as readonly number[]).includes(n)) return n;
  } catch {
    // localStorage が使えない環境では既定値
  }
  return 2;
}

function loadFormat(): OutputFormat {
  try {
    const saved = localStorage.getItem(FORMAT_KEY);
    if (saved && saved in outputFormatMap) return saved as OutputFormat;
  } catch {
    // localStorage が使えない環境では既定値
  }
  return 'jpeg';
}

export default function ImageConvertPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [format, setFormatState] = useState<OutputFormat>(loadFormat);
  const [quality, setQuality] = usePersistedQuality('image-convert');
  const [vectorScale, setVectorScaleState] = useState<number>(loadScale);
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [failures, setFailures] = useState<{ name: string; message: string }[]>([]);

  const formatInfo = outputFormatMap[format];
  const hasVector = files.some((f) => isVectorFile(f.file));

  const setVectorScale = useCallback((n: number) => {
    setVectorScaleState(n);
    try {
      localStorage.setItem(SCALE_KEY, String(n));
    } catch {
      // 保存できなくても動作は継続
    }
  }, []);

  const setFormat = useCallback((f: OutputFormat) => {
    setFormatState(f);
    try {
      localStorage.setItem(FORMAT_KEY, f);
    } catch {
      // 保存できなくても動作は継続
    }
  }, []);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles.map((f) => ({ id: generateId(), file: f }))]);
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
    setFiles((prev) => [...prev, ...newFiles.map((f) => ({ id: generateId(), file: f }))]);
  }, []);

  const handleProcess = useCallback(async () => {
    setPhase('processing');
    setProcessing(
      files.map((f) => ({ id: f.id, originalFile: f.file, status: 'pending' as const, progress: 0 }))
    );

    const update = (id: string, patch: Partial<ProcessingFile>) =>
      setProcessing((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

    const completed: ProcessedFile[] = [];
    const failed: { name: string; message: string }[] = [];
    const usedNames = new Set<string>();

    // photo.jpg と photo.tiff を同時に変換すると両方 photo.png になり ZIP 内で上書きされるため、
    // 重複時は元の拡張子を付けて区別する（photo_tiff.png）
    const uniqueName = (original: string): string => {
      let name = changeExtension(original, formatInfo.ext);
      if (usedNames.has(name.toLowerCase())) {
        const dot = original.lastIndexOf('.');
        const base = dot > 0 ? original.slice(0, dot) : original;
        const srcExt = dot > 0 ? original.slice(dot + 1) : '';
        name = `${base}${srcExt ? `_${srcExt}` : ''}.${formatInfo.ext}`;
        for (let n = 2; usedNames.has(name.toLowerCase()); n++) {
          name = `${base}${srcExt ? `_${srcExt}` : ''}_${n}.${formatInfo.ext}`;
        }
      }
      usedNames.add(name.toLowerCase());
      return name;
    };

    for (const file of files) {
      update(file.id, { status: 'processing', progress: 10 });
      try {
        const canvas = await decodeImage(file.file, { vectorScale });
        update(file.id, { progress: 50 });
        const resultBlob = await encodeImage(canvas, format, quality);
        update(file.id, { status: 'done', progress: 100 });

        completed.push({
          id: file.id,
          originalFile: file.file,
          resultBlob,
          resultFilename: uniqueName(file.file.name),
          originalSize: file.file.size,
          resultSize: resultBlob.size,
        });
      } catch (err) {
        const message = (err as Error).message;
        update(file.id, { status: 'error', progress: 100, error: message });
        failed.push({ name: file.file.name, message });
      }
    }

    setResults(completed);
    setFailures(failed);
    setTimeout(() => setPhase('complete'), 600);
  }, [files, format, quality, vectorScale, formatInfo.ext]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setFailures([]);
    setPhase('select');
  }, []);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-6">画像形式を変換</h1>

        {phase === 'select' && (
          <DropZone mode="image-convert" onFilesSelected={handleFilesSelected} />
        )}

        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList files={files} mode="image-convert" onRemove={handleRemove} onAdd={handleAdd} />

            {/* 変換後の形式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">変換後の形式</label>
              <div className="grid grid-cols-4 gap-2">
                {outputFormats.map((f) => {
                  const selected = f.id === format;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={`relative rounded-xl border-2 py-2.5 text-sm font-semibold transition-all duration-150
                        ${selected
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                    >
                      {f.label}
                      {selected && (
                        <Check size={14} className="absolute top-1.5 right-1.5 text-primary-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 px-1">{formatInfo.note}</p>
            </div>

            {/* SVG / AI / EPS はベクターなので書き出し解像度を選べる */}
            {hasVector && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  書き出し解像度（SVG / AI / EPS）
                </label>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {SCALE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setVectorScale(n)}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors
                        ${vectorScale === n
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {n === 1 ? '等倍' : `${n}倍`}
                      <span className="ml-1 text-xs text-gray-400">{72 * n}dpi</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 px-1">
                  等倍＝アートボードのサイズそのまま。Web用の高解像度なら2倍、印刷用なら4倍（288dpi）がおすすめです
                </p>
              </div>
            )}

            {formatInfo.lossy && (
              <QualitySelector options={convertQualityOptions} value={quality} onChange={setQuality} />
            )}

            <button
              type="button"
              onClick={handleProcess}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base"
            >
              {formatInfo.label}に変換
            </button>
          </div>
        )}

        {phase === 'processing' && <ProcessingView files={processing} />}
        {phase === 'complete' && (
          <ResultsView
            files={results}
            failures={failures}
            onReset={handleReset}
            resultLabel={formatInfo.label}
          />
        )}
      </div>
    </PageLayout>
  );
}
