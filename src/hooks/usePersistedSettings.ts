import { useState, useCallback } from 'react';
import type { QualityLevel, FeatureMode } from '../types';

export function usePersistedQuality(mode: FeatureMode) {
  const key = `quality_${mode}`;
  const [quality, setQualityState] = useState<QualityLevel>(() => {
    const saved = localStorage.getItem(key);
    if (saved === 'high-compression' || saved === 'recommended' || saved === 'low-compression') {
      return saved;
    }
    return 'recommended';
  });

  const setQuality = useCallback((q: QualityLevel) => {
    setQualityState(q);
    localStorage.setItem(key, q);
  }, [key]);

  return [quality, setQuality] as const;
}

export function usePersistedTargetSize() {
  const key = 'target_size_kb';
  const [targetSize, setTargetSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(key);
    const num = saved ? parseInt(saved, 10) : NaN;
    return isNaN(num) ? 1000 : num;
  });

  const setTargetSize = useCallback((size: number) => {
    setTargetSizeState(size);
    localStorage.setItem(key, String(size));
  }, []);

  return [targetSize, setTargetSize] as const;
}
