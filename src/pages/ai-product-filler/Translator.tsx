import { useEffect } from 'react';
import AIProductFillerGeneration from './Generation';

export default function AIProductFillerTranslatorPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'AI Переклад — AI Product Filler';
    return () => { document.title = prev; };
  }, []);
  return <AIProductFillerGeneration title="AI переклад" mode="translation" />;
}
