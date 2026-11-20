import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './routes/TopPage';
import CompressPage from './routes/CompressPage';
import WebpConvertPage from './routes/WebpConvertPage';
import CompressAndWebpPage from './routes/CompressAndWebpPage';
import ResizePage from './routes/ResizePage';
import PsdConvertPage from './routes/PsdConvertPage';
import ImageConvertPage from './routes/ImageConvertPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/compress" element={<CompressPage />} />
        <Route path="/webp-convert" element={<WebpConvertPage />} />
        <Route path="/compress-and-webp" element={<CompressAndWebpPage />} />
        <Route path="/resize" element={<ResizePage />} />
        <Route path="/psd-convert" element={<PsdConvertPage />} />
        <Route path="/image-convert" element={<ImageConvertPage />} />
      </Routes>
    </BrowserRouter>
  );
}
