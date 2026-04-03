import { PDFDocument } from 'pdf-lib';

export async function compressPdf(
  file: File,
  onProgress: (progress: number) => void
): Promise<Blob> {
  onProgress(10);

  const arrayBuffer = await file.arrayBuffer();
  onProgress(30);

  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  });
  onProgress(60);

  const savedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
  onProgress(100);

  const buffer = savedBytes.slice().buffer as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}
