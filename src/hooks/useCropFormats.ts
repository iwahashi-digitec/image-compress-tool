import { useState, useCallback } from 'react';
import { BUILT_IN_FORMATS } from '../constants/cropFormats';
import type { CropFormat } from '../constants/cropFormats';

const STORAGE_KEY = 'custom_crop_formats_v1';

function loadCustom(): CropFormat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CropFormat[]) : [];
  } catch {
    return [];
  }
}

function persist(formats: CropFormat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formats));
}

export function useCropFormats() {
  const [custom, setCustom] = useState<CropFormat[]>(loadCustom);

  const allFormats: CropFormat[] = [...BUILT_IN_FORMATS, ...custom];

  const addFormat = useCallback((name: string, width: number, height: number): CropFormat => {
    const f: CropFormat = { id: `custom_${Date.now()}`, name, width, height, builtIn: false };
    setCustom((prev) => {
      const next = [...prev, f];
      persist(next);
      return next;
    });
    return f;
  }, []);

  const updateFormat = useCallback((id: string, name: string, width: number, height: number) => {
    setCustom((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, name, width, height } : f));
      persist(next);
      return next;
    });
  }, []);

  const deleteFormat = useCallback((id: string) => {
    setCustom((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { allFormats, addFormat, updateFormat, deleteFormat };
}
