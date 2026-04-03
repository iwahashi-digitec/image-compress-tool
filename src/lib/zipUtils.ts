import JSZip from 'jszip';
import type { ProcessedFile } from '../types';

export async function createZip(files: ProcessedFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const f of files) {
    zip.file(f.resultFilename, f.resultBlob);
  }

  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
