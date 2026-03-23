import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AIProductFillerLayout from './components/AIProductFillerLayout';

export default function WatermarkRemoval() {
  const navigate = useNavigate();

  useEffect(() => {
    // Редірект на нову сторінку PhotoEditor
    navigate('/ai-product-filler/photo-editor', { replace: true });
  }, [navigate]);

  return (
    <AIProductFillerLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Перенаправлення на Робота з фото...</p>
      </div>
    </AIProductFillerLayout>
  );
}
