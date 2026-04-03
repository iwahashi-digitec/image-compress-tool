import { useState, useCallback } from 'react';
import type { Phase, UploadedFile, ProcessingFile, ProcessedFile, QualityLevel } from '../types';
import { generateId, changeExtension } from '../lib/fileUtils';
import { convertToWebp, checkWebpSupport } from '../lib/convertToWebp';
import { compressImage } from '../lib/compressImage';
import { webpPresets } from '../constants/qualityPresets';
import { usePersistedQuality } from '../hooks/usePersistedSettings';

import PageLayout from '../components/layout/PageLayout';
import DropZone from '../components/file-upload/DropZone';
import FileList from '../components/file-upload/FileList';
import QualitySelector from '../components/settings/QualitySelector';
import ProcessingView from '../components/processing/ProcessingView';
import ResultsView from '../components/results/ResultsView';
import WebpUnsupportedDialog from '../components/WebpUnsupportedDialog';

const qualityOptions = Object.entries(webpPresets).map(([key, val]) => ({
  key: key as QualityLevel,
  label: val.label,
  description: val.description,
}));

export default function WebpConvertPage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [quality, setQuality] = usePersistedQuality('webp-convert');
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

  const runProcess = useCallback(async (useJpeg: boolean) => {
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
        prev.map((p) => p.id === file.id ? { ...p, status: 'processing' } : p)
      );

      try {
        let resultBlob: Blob;
        let resultFilename: string;

        if (useJpeg) {
          resultBlob = await compressImage(file.file, quality, (progress) => {
            setProcessing((prev) =>
              prev.map((p) => p.id === file.id ? { ...p, progress } : p)
            );
          });
          resultFilename = file.file.name;
        } else {
          resultBlob = await convertToWebp(file.file, quality, (progress) => {
            setProcessing((prev) =>
              prev.map((p) => p.id === file.id ? { ...p, progress } : p)
            );
          });
          resultFilename = changeExtension(file.file.name, 'webp');
        }

        setProcessing((prev) =>
          prev.map((p) => p.id === file.id ? { ...p, status: 'done', progress: 100 } : p)
        );

        completed.push({
          id: file.id,
          originalFile: file.file,
          resultBlob,
          resultFilename,
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
  }, [files, quality]);

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
        <h1 className="text-xl font-bold text-gray-800 mb-6">画像をWebPに変換</h1>

        {phase === 'select' && (
          <DropZone mode="webp-convert" onFilesSelected={handleFilesSelected} />
        )}

        {phase === 'configure' && (
          <div className="space-y-6">
            <FileList files={files} mode="webp-convert" onRemove={handleRemove} onAdd={handleAdd} />
            <QualitySelector options={qualityOptions} value={quality} onChange={setQuality} />
            <button
              onClick={handleProcessClick}
              className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl
                font-medium hover:bg-primary-700 transition-colors text-base"
            >
              WebPに変換
            </button>
          </div>
        )}

        {phase === 'processing' && <ProcessingView files={processing} />}
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
