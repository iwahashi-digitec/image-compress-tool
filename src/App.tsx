import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopPage from './routes/TopPage';
import CompressPage from './routes/CompressPage';
import CompressAndWebpPage from './routes/CompressAndWebpPage';
import ResizePage from './routes/ResizePage';
import ImageConvertPage from './routes/ImageConvertPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/compress" element={<CompressPage />} />
        <Route path="/compress-and-webp" element={<CompressAndWebpPage />} />
        <Route path="/resize" element={<ResizePage />} />
        <Route path="/image-convert" element={<ImageConvertPage />} />
        {/* 旧URL（ブックマーク対策）: 画像形式変換に統合済み */}
        <Route path="/webp-convert" element={<Navigate to="/image-convert?to=webp" replace />} />
        <Route path="/psd-convert" element={<Navigate to="/image-convert?to=jpeg" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
