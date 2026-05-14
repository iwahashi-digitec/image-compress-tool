export interface CropFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  builtIn: boolean;
}

export const BUILT_IN_FORMATS: CropFormat[] = [
  { id: 'eyecatch-1', name: 'アイキャッチ画像①', width: 1800, height: 945, builtIn: true },
  { id: 'eyecatch-2', name: 'アイキャッチ画像②', width: 2400, height: 1600, builtIn: true },
  { id: 'social', name: 'ソーシャル用アイキャッチ', width: 1200, height: 630, builtIn: true },
  { id: 'blast-mail', name: 'ブラストメールトップ', width: 1000, height: 500, builtIn: true },
];
