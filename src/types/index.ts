export type FeatureMode = 'compress' | 'webp-convert' | 'compress-and-webp';

export type QualityLevel = 'high-compression' | 'recommended' | 'low-compression';

export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

export type Phase = 'select' | 'configure' | 'processing' | 'complete';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

export interface ProcessingFile {
  id: string;
  originalFile: File;
  status: ProcessingStatus;
  progress: number;
  currentStep?: 1 | 2;
  error?: string;
}

export interface ProcessedFile {
  id: string;
  originalFile: File;
  resultBlob: Blob;
  resultFilename: string;
  originalSize: number;
  resultSize: number;
  intermediateSize?: number;
}
