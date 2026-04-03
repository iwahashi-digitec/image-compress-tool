import { Link } from 'react-router-dom';
import { FileDown, ImageIcon, Layers } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const features = [
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
    to: '/webp-convert',
    icon: ImageIcon,
    title: '画像をWebPに変換',
    description: 'JPEG / PNG をWebP形式に変換して軽量化します',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'hover:border-emerald-300',
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
];

export default function TopPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            画像・PDF圧縮 & WebP変換
          </h1>
          <p className="text-gray-500">
            やりたいことを選んでください
          </p>
        </div>

        <div className="grid gap-4">
          {features.map((f) => (
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
                <h2 className="text-lg font-bold text-gray-800 group-hover:text-gray-900">
                  {f.title}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {f.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
