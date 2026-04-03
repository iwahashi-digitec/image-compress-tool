export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getReductionPercent(original: number, result: number): number {
  if (original === 0) return 0;
  return Math.round(((original - result) / original) * 100);
}

export function changeExtension(filename: string, newExt: string): string {
  const lastDot = filename.lastIndexOf('.');
  const base = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  return `${base}.${newExt}`;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

export function generateId(): string {
  return crypto.randomUUID();
}
