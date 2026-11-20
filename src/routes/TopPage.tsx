import { Link } from 'react-router-dom';
import { FileDown, Layers, Crop, Repeat } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const groups = [
  {
    label: '変換',
    items: [
      {
        to: '/image-convert',
        icon: Repeat,
        title: '画像形式を変換',
        description: 'JPG / PNG / WebP / AVIF / GIF / BMP / TIFF / ICO など好きな形式に変換します',
        color: 'text-sky-500',
        bg: 'bg-sky-50',
        border: 'hover:border-sky-300',
      },
    ],
  },
  {
    label: '圧縮',
    items: [
      {
        to: '/compress',
        icon: FileDown,
        title: '画像・PDFを圧縮',
        description: 'JPEG / PNG / WebP / PDF のファイルサイズを削減します',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'hover:border-blue-300',
      },
      {
        to: '/compress-and-webp',
        icon: Layers,
        title: '圧縮してWebPに変換',
        description: 'JPEGを目標サイズに圧縮し、さらにWebPに変換します',
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'hover:border-purple-300',
      },
    ],
  },
  {
    label: '編集',
    items: [
      {
        to: '/resize',
        icon: Crop,
        title: 'トリミング',
        description: '画像をドラッグまたはピクセル数値指定でトリミングします',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        border: 'hover:border-orange-300',
      },
    ],
  },
];

export default function TopPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ファイル最適化ツール
          </h1>
          <p className="text-gray-500">
            やりたいことを選んでください
          </p>
        </div>

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                {group.label}
              </h2>
              <div className="grid gap-3">
                {group.items.map((f) => (
                  <Link
                    key={f.to}
                    to={f.to}
                    className={`
                      flex items-center gap-5 p-6 bg-white rounded-2xl border-2 border-gray-200
                      transition-all duration-200 group
                      hover:shadow-md hover:scale-[1.01] ${f.border}
                    `}
                  >
                    <div className={`rounded-xl p-3.5 ${f.bg}`}>
                      <f.icon size={28} className={f.color} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900">
                        {f.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {f.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
