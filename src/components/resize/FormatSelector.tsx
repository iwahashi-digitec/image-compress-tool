import { useState } from 'react';
import type { CropFormat } from '../../constants/cropFormats';
import { useCropFormats } from '../../hooks/useCropFormats';

interface Props {
  selectedId: string | null;
  onSelect: (format: CropFormat | null) => void;
}

interface EditState {
  mode: 'add' | 'edit';
  id?: string;
  name: string;
  widthStr: string;
  heightStr: string;
}

export default function FormatSelector({ selectedId, onSelect }: Props) {
  const { allFormats, addFormat, updateFormat, deleteFormat } = useCropFormats();
  const [edit, setEdit] = useState<EditState | null>(null);

  const startAdd = () => setEdit({ mode: 'add', name: '', widthStr: '', heightStr: '' });

  const startEdit = (f: CropFormat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEdit({ mode: 'edit', id: f.id, name: f.name, widthStr: String(f.width), heightStr: String(f.height) });
  };

  const cancelEdit = () => setEdit(null);

  const saveEdit = () => {
    if (!edit) return;
    const w = parseInt(edit.widthStr, 10);
    const h = parseInt(edit.heightStr, 10);
    if (!edit.name.trim() || !w || !h || w <= 0 || h <= 0) return;

    if (edit.mode === 'add') {
      const newF = addFormat(edit.name.trim(), w, h);
      onSelect(newF);
    } else if (edit.id) {
      updateFormat(edit.id, edit.name.trim(), w, h);
      if (selectedId === edit.id) {
        onSelect({ id: edit.id, name: edit.name.trim(), width: w, height: h, builtIn: false });
      }
    }
    setEdit(null);
  };

  const handleDelete = (f: CropFormat, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFormat(f.id);
    if (selectedId === f.id) onSelect(null);
  };

  const isValid = edit
    ? edit.name.trim() !== '' && parseInt(edit.widthStr) > 0 && parseInt(edit.heightStr) > 0
    : false;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {allFormats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(selectedId === f.id ? null : f)}
            className={`relative text-left rounded-xl border-2 p-3 transition-colors
              ${selectedId === f.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'}`}
          >
            <div className="text-sm font-medium text-gray-800 leading-tight pr-14">{f.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{f.width} × {f.height} px</div>

            {f.builtIn ? (
              <span className="absolute top-2 right-2 text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                標準
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 flex gap-0.5">
                <button
                  type="button"
                  onClick={(e) => startEdit(f, e)}
                  className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-100 transition-colors"
                  title="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(f, e)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </span>
            )}

            {selectedId === f.id && (
              <span className="absolute bottom-2 right-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {edit ? (
        <div className="border border-primary-200 bg-primary-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {edit.mode === 'add' ? 'フォーマットを追加' : 'フォーマットを編集'}
          </p>
          <input
            type="text"
            value={edit.name}
            onChange={(e) => setEdit((p) => p ? { ...p, name: e.target.value } : null)}
            placeholder="フォーマット名（例: OGP画像）"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 bg-white"
            autoFocus
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">幅 (px)</label>
              <input
                type="number"
                value={edit.widthStr}
                onChange={(e) => setEdit((p) => p ? { ...p, widthStr: e.target.value } : null)}
                placeholder="1800"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              />
            </div>
            <span className="pb-2 text-gray-400 text-sm">×</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">高さ (px)</label>
              <input
                type="number"
                value={edit.heightStr}
                onChange={(e) => setEdit((p) => p ? { ...p, heightStr: e.target.value } : null)}
                placeholder="945"
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              />
            </div>
            <span className="pb-2 text-xs text-gray-400">px</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              disabled={!isValid}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium
                hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="py-2 px-4 border border-gray-300 text-gray-600 rounded-lg text-sm
                hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500
            hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-colors
            flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          フォーマットを追加
        </button>
      )}
    </div>
  );
}
