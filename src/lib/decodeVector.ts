/**
 * ベクター形式（Illustrator / EPS）を canvas に描画する。
 * - .ai（PDF互換あり） → pdf.js で1ページ目（最初のアートボード）を描画
 * - .eps / 旧形式の .ai（PostScript） → Ghostscript（WASM）で PNG に描画
 * どちらも重いので、使う時だけ動的 import する。
 *
 * scale = 1 のとき 72dpi（Illustrator の pt / px 単位そのまま）で描画する。
 */

/** canvas の1辺の上限（ブラウザの制限・メモリ対策） */
const MAX_SIDE = 16000;

function clampScale(widthPt: number, heightPt: number, scale: number): number {
  const maxSide = Math.max(widthPt, heightPt) * scale;
  return maxSide > MAX_SIDE ? MAX_SIDE / Math.max(widthPt, heightPt) : scale;
}

async function startsWith(file: File, signature: string): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const text = String.fromCharCode(...head);
  return text.includes(signature);
}

// ---------------------------------------------------------------- pdf.js

async function renderPdfFirstPage(file: File, scale: number): Promise<HTMLCanvasElement> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);

    // PDF互換なしで保存された .ai には「PDF Content なしで保存されました」という
    // ダミーページしか入っていないので、検出して案内を出す
    const text = (await page.getTextContent()).items
      .map((i) => ('str' in i ? i.str : ''))
      .join('');
    if (/saved without PDF Content|PDF コンテンツなしで保存/i.test(text)) {
      throw new Error(
        'このIllustratorファイルはPDF互換なしで保存されています。Illustratorで「PDF互換ファイルを作成」にチェックを入れて保存し直してください。'
      );
    }

    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: clampScale(base.width, base.height, scale) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    // pdf.js に canvas だけ渡すと透過なし（alpha: false）のコンテキストを作られ、
    // 透明部分が黒になるため、透過ありのコンテキストを先に作って渡す
    const canvasContext = canvas.getContext('2d', { alpha: true })!;
    await page.render({ canvas, canvasContext, viewport, background: 'rgba(0,0,0,0)' }).promise;
    return canvas;
  } finally {
    await task.destroy();
  }
}

// ---------------------------------------------------------------- Ghostscript

/** Ghostscript の出力の1辺の上限（ページ全体をメモリ上に描画するため控えめにする） */
const GS_MAX_SIDE = 10000;

/** png: 出力 / crashed: WASM がメモリ不足などで異常終了した（解像度を下げれば成功する可能性あり） */
async function runGhostscript(
  data: Uint8Array,
  dpi: number
): Promise<{ png: Uint8Array | null; crashed: boolean }> {
  const [{ default: loadGs }, { default: wasmUrl }] = await Promise.all([
    import('@okathira/ghostpdl-wasm'),
    import('@okathira/ghostpdl-wasm/gs.wasm?url'),
  ]);

  const logs: string[] = [];
  // callMain は1インスタンスにつき1回しか呼べないため、毎回作り直す
  // （wasm 本体はブラウザにキャッシュされるので2回目以降は速い）
  const gs = await loadGs({
    locateFile: () => wasmUrl,
    print: (s: string) => logs.push(s),
    printErr: (s: string) => logs.push(s),
  });
  gs.FS.writeFile('/in.eps', data);

  try {
    const code = gs.callMain([
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dEPSCrop',
      '-dTextAlphaBits=4',
      '-dGraphicsAlphaBits=4',
      // WASM 版はバンド分割描画で、埋め込み画像を大きく描くとクラッシュするため
      // ページ全体を一括でメモリ上に描画させる
      '-dMaxBitmap=2000000000',
      '-sDEVICE=pngalpha',
      `-r${dpi}`,
      '-dFirstPage=1',
      '-dLastPage=1',
      '-sOutputFile=/out.png',
      '/in.eps',
    ]);
    if (code !== 0) {
      // PostScript のエラー（ファイル自体の問題）。解像度を変えても直らない
      console.error('Ghostscript error', code, logs.join('\n'));
      return { png: null, crashed: false };
    }
    return { png: gs.FS.readFile('/out.png'), crashed: false };
  } catch (e) {
    console.error('Ghostscript crashed', dpi, e, logs.join('\n'));
    return { png: null, crashed: true };
  }
}

async function renderWithGhostscript(file: File, scale: number): Promise<HTMLCanvasElement> {
  const data = new Uint8Array(await file.arrayBuffer());

  // BoundingBox からサイズを測り、上限を超えないよう解像度を決める
  const bbox = await readBoundingBox(file);
  let effective = bbox ? Math.min(scale, GS_MAX_SIDE / Math.max(bbox.w, bbox.h)) : scale;

  // 失敗したら解像度を下げて再試行する（メモリ不足対策）
  let png: Uint8Array | null = null;
  for (;;) {
    const result = await runGhostscript(data, Math.round(72 * effective));
    png = result.png;
    if (png || !result.crashed || effective <= 1) break;
    effective = Math.max(1, effective / 2);
  }
  if (!png) {
    throw new Error('EPSを描画できませんでした（ファイルが壊れているか、非対応の内容が含まれています）');
  }

  const bitmap = await createImageBitmap(new Blob([new Uint8Array(png)], { type: 'image/png' }));
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

/** EPS の %%BoundingBox からサイズ（pt）を読む */
async function readBoundingBox(file: File): Promise<{ w: number; h: number } | null> {
  const head = await file.slice(0, 64 * 1024).text();
  const m = head.match(/%%(?:HiRes)?BoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/);
  if (!m) return null;
  const [x1, y1, x2, y2] = m.slice(1).map(Number);
  return { w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

// ---------------------------------------------------------------- 公開API

export async function decodeIllustrator(file: File, scale: number): Promise<HTMLCanvasElement> {
  // CS 以降の .ai は PDF 互換（%PDF で始まる）。それ以前は PostScript ベース
  if (await startsWith(file, '%PDF')) return renderPdfFirstPage(file, scale);
  return renderWithGhostscript(file, scale);
}

export async function decodeEps(file: File, scale: number): Promise<HTMLCanvasElement> {
  return renderWithGhostscript(file, scale);
}
