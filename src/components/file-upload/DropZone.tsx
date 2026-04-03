import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { FeatureMode } from '../../types';
import { acceptedMimeTypes, acceptedExtensions, formatLabels } from '../../constants/acceptedFormats';

interface Props {
  mode: FeatureMode;
  onFilesSelected: (files: File[]) => void;
}

export default function DropZone({ mode, onFilesSelected }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const accepted = acceptedMimeTypes[mode];
      return Array.from(files).filter((f) => accepted.includes(f.type));
    },
    [mode]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [validateFiles, onFilesSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const valid = validateFiles(e.target.files);
        if (valid.length > 0) onFilesSelected(valid);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [validateFiles, onFilesSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
        flex flex-col items-center justify-center gap-4 transition-all duration-200
        ${
          isDragging
            ? 'border-primary-400 bg-primary-50 scale-[1.01]'
            : 'border-gray-300 bg-white hover:border-primary-300 hover:bg-gray-50'
        }
      `}
    >
      <div
        className={`rounded-full p-4 transition-colors ${
          isDragging ? 'bg-primary-100' : 'bg-gray-100'
        }`}
      >
        <Upload
          size={32}
          className={isDragging ? 'text-primary-500' : 'text-gray-400'}
        />
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">
          ファイルをドラッグ&ドロップ
        </p>
        <p className="text-sm text-gray-500 mt-1">
          または
          <span className="text-primary-600 font-medium mx-1">クリックして選択</span>
        </p>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          対応形式: {formatLabels[mode]}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedExtensions[mode]}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
