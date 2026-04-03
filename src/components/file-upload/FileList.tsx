import { useEffect, useState } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import type { UploadedFile, FeatureMode } from '../../types';
import { formatFileSize, isImageFile } from '../../lib/fileUtils';
import { acceptedExtensions } from '../../constants/acceptedFormats';
import { acceptedMimeTypes } from '../../constants/acceptedFormats';
import { useRef } from 'react';

interface Props {
  files: UploadedFile[];
  mode: FeatureMode;
  onRemove: (id: string) => void;
  onAdd: (files: File[]) => void;
}

function Thumbnail({ file }: { file: UploadedFile }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isImageFile(file.file)) {
      const url = URL.createObjectURL(file.file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.file]);

  if (src) {
    return (
      <img
        src={src}
        alt={file.file.name}
        className="w-12 h-12 object-cover rounded-lg"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
      <FileText size={20} className="text-red-400" />
    </div>
  );
}

export default function FileList({ files, mode, onRemove, onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const accepted = acceptedMimeTypes[mode];
      const valid = Array.from(e.target.files).filter((f) =>
        accepted.includes(f.type)
      );
      if (valid.length > 0) onAdd(valid);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">
          選択ファイル ({files.length})
        </h3>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Plus size={14} />
          追加
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedExtensions[mode]}
          onChange={handleAddFiles}
          className="hidden"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 group"
          >
            <Thumbnail file={f} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {f.file.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(f.file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemove(f.id)}
              className="p-1 text-gray-300 hover:text-danger-500 transition-colors opacity-0 group-hover:opacity-100"
              title="削除"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
