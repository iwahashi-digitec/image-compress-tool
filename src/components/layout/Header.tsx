import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ImageDown } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const isTop = location.pathname === '/';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        {!isTop && (
          <Link
            to="/"
            className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors text-sm mr-2"
          >
            <ArrowLeft size={16} />
            <span>トップ</span>
          </Link>
        )}
        <Link to="/" className="flex items-center gap-2 text-gray-800 font-bold">
          <ImageDown size={22} className="text-primary-600" />
          <span className="text-base">画像・PDF圧縮ツール</span>
        </Link>
      </div>
    </header>
  );
}
