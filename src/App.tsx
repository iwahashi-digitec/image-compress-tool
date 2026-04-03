import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './routes/TopPage';
import CompressPage from './routes/CompressPage';
import WebpConvertPage from './routes/WebpConvertPage';
import CompressAndWebpPage from './routes/CompressAndWebpPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/compress" element={<CompressPage />} />
        <Route path="/webp-convert" element={<WebpConvertPage />} />
        <Route path="/compress-and-webp" element={<CompressAndWebpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
