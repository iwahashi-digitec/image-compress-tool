import { useState, useCallback } from 'react';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile, QualityLevel } from '../types';
import { generateId, changeExtension } from '../lib/fileUtils';
import { compressToTargetSize } from '../lib/compressToTargetSize';
import { convertToWebp, checkWebpSupport } from '../lib/convertToWebp';
import { webpPresets } from '../constants/qualityPresets';
import { usePersistedQuality, usePersistedTargetSize } from '../hooks/usePersistedSettings';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import QualitySelector from '../components/settings/QualitySelector';
import TargetSizeInput from '../components/settings/TargetSizeInput';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';
import WebpUnsupportedDialog from '../components/WebpUnsupportedDialog';

const qualityOptions = Object.entries(webpPresets).map(([key, val]) => ({
  key: key as QualityLevel,
  label: val.label,
  description: val.description,
}));

export default function CompressAndWebpPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [quality, setQuality] = usePersistedQuality('compress-and-webp');
  const [targetSize, setTargetSize] = usePersistedTargetSize();
  const [processing, setProcessing] = useState<ProcessingFile[]>([]);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);

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
    const uploaded = newFiles.map((f) => ({ id: generateId(), file: f }));
    setFiles((prev) => [...prev, ...uploaded]);
  }, []);

  const runProcess = useCallback(async (skipWebp: boolean) => {
    setShowUnsupportedDialog(false);
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
        prev.map((p) => p.id === file.id ? { ...p, status: 'processing', currentStep: 1 } : p)
      );

      try {
        // STEP 1: Compress to target size
        const compressedBlob = await compressToTargetSize(
          file.file,
          targetSize,
          (progress) => {
            setProcessing((prev) =>
              prev.map((p) =>
                p.id === file.id
                  ? { ...p, progress: skipWebp ? progress : progress * 0.5 }
                  : p
              )
            );
          }
        );

        const intermediateSize = compressedBlob.size;

        if (skipWebp) {
          // WebP非対応: 圧縮JPEGをそのまま返す
          setProcessing((prev) =>
            prev.map((p) => p.id === file.id ? { ...p, status: 'done', progress: 100 } : p)
          );
          completed.push({
            id: file.id,
            originalFile: file.file,
            resultBlob: compressedBlob,
            resultFilename: file.file.name,
            originalSize: file.file.size,
            resultSize: compressedBlob.size,
          });
        } else {
          // STEP 2: Convert to WebP
          setProcessing((prev) =>
            prev.map((p) =>
              p.id === file.id ? { ...p, currentStep: 2, progress: 50 } : p
            )
          );

          const webpBlob = await convertToWebp(compressedBlob, quality, (progress) => {
            setProcessing((prev) =>
              prev.map((p) =>
                p.id === file.id ? { ...p, progress: 50 + progress * 0.5 } : p
              )
            );
          });

          setProcessing((prev) =>
            prev.map((p) => p.id === file.id ? { ...p, status: 'done', progress: 100 } : p)
          );

          completed.push({
            id: file.id,
            originalFile: file.file,
            resultBlob: webpBlob,
            resultFilename: changeExtension(file.file.name, 'webp'),
            originalSize: file.file.size,
            resultSize: webpBlob.size,
            intermediateSize,
          });
        }
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
  }, [files, quality, targetSize]);

  const handleProcessClick = useCallback(async () => {
    const supported = await checkWebpSupport();
    if (!supported) {
      setShowUnsupportedDialog(true);
    } else {
      runProcess(false);
    }
  }, [runProcess]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessing([]);
    setResults([]);
    setPhase('select');
  }, []);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-6">圧縮してWebPに変換</h1>

        {phase === 'select' && (
          <DropZone mode="compress-and-webp" onFilesSelected={handleFilesSelected} />
        )}

        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList files={files} mode="compress-and-webp" onRemove={handleRemove} onAdd={handleAdd} />
            <TargetSizeInput value={targetSize} onChange={setTargetSize} />
            <QualitySelector options={qualityOptions} value={quality} onChange={setQuality} />
            <button
              onClick={handleProcessClick}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base"
            >
              圧縮してWebPに変換
            </button>
          </div>
        )}

        {phase === 'processing' && <ProcessingView files={processing} showSteps />}
        {phase === 'complete' && <ResultsView files={results} onReset={handleReset} />}

        {showUnsupportedDialog && (
          <WebpUnsupportedDialog
            onConfirm={() => runProcess(true)}
            onCancel={() => setShowUnsupportedDialog(false)}
          />
        )}
      </div>
    </PageLayout>
  );
}
