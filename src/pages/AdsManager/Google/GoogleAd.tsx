import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useGenerateGoogleAdMutation } from '@/services/adsManager/facebook.api';
import { Loader2, Download, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const GoogleAd = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [selectedLongTitleIndex, setSelectedLongTitleIndex] = useState(0);
  const [selectedDescIndex, setSelectedDescIndex] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'text' | 'images' | null>(null);
  const [copiedImage, setCopiedImage] = useState<number | null>(null);
  const { toast } = useToast();

  const [generateAd, { data: adData, isLoading }] = useGenerateGoogleAdMutation();

  useEffect(() => {
    if (isLoading) {
      setLoadingPhase('text');
      const timer = setTimeout(() => {
        setLoadingPhase('images');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setLoadingPhase(null);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Помилка',
        description: 'Назва є обов\'язковим полем',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateAd({ title, description }).unwrap();
    } catch (error) {
      toast({
        title: 'Помилка генерації',
        description: 'Не вдалося згенерувати контент. Спробуйте пізніше.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyImage = (index: number) => {
    if (adData?.images[index]) {
      const img = adData.images[index];
      navigator.clipboard.writeText(img)
        .then(() => {
          setCopiedImage(index);
          setTimeout(() => setCopiedImage(null), 2000);
          toast({
            title: 'Зображення скопійовано',
            description: 'Base64 код зображення скопійовано в буфер обміну.',
          });
        })
        .catch(() => {
          toast({
            title: 'Помилка копіювання',
            description: 'Не вдалося скопіювати зображення.',
            variant: 'destructive',
          });
        });
    }
  };

  const handleDownloadImage = (index: number) => {
    if (adData?.images[index]) {
      const img = adData.images[index];
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${img}`;
      link.download = `google-ad-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Функція для копіювання тексту
  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: 'Скопійовано', 
      description: `${type} скопійовано в буфер обміну.` 
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-500">Генерація Google реклами</h1>
      
      <Card className="p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Назва товару/послуги *
            </label>
            <Input
              id="title"
              placeholder="Введіть назву товару або послуги"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Опис (необов'язково)
            </label>
            <Textarea
              id="description"
              placeholder="Введіть додаткову інформацію про товар або послугу"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex justify-center">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingPhase === 'text' ? 'Генерація тексту...' : 'Генерація зображень...'}
                </>
              ) : 'Згенерувати'}
            </Button>
          </div>
        </form>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 relative">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-lg font-medium">
            {loadingPhase === 'text' ? 'Генерація тексту...' : 'Генерація зображень...'}
          </p>
        </div>
      )}
      
      {adData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Заголовки (багато, показуємо лише активний) */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Заголовки</h2>
            <Tabs 
              defaultValue="0" 
              value={selectedTitleIndex.toString()} 
              onValueChange={(value) => setSelectedTitleIndex(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-6 mb-4">
                {adData.titles.slice(0, 30).map((_, index) => (
                  <TabsTrigger 
                    key={`title-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="p-4 bg-secondary/30 rounded-md">
                <p className="text-base">{adData.titles[selectedTitleIndex]}</p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyText(adData.titles[selectedTitleIndex], 'Заголовок')}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Копіювати
                  </Button>
                </div>
              </div>
            </Tabs>
          </Card>
          
          {/* Довгі заголовки */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Довгі заголовки</h2>
            <Tabs 
              defaultValue="0" 
              value={selectedLongTitleIndex.toString()} 
              onValueChange={(value) => setSelectedLongTitleIndex(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 mb-4">
                {adData.long_titles.map((_, index) => (
                  <TabsTrigger 
                    key={`long-title-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="p-4 bg-secondary/30 rounded-md">
                <p className="text-base">{adData.long_titles[selectedLongTitleIndex]}</p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyText(adData.long_titles[selectedLongTitleIndex], 'Довгий заголовок')}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Копіювати
                  </Button>
                </div>
              </div>
            </Tabs>
          </Card>
          
          {/* Описи */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Описи</h2>
            <Tabs 
              defaultValue="0" 
              value={selectedDescIndex.toString()} 
              onValueChange={(value) => setSelectedDescIndex(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 mb-4">
                {adData.descriptions.map((_, index) => (
                  <TabsTrigger 
                    key={`desc-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="p-4 bg-secondary/30 rounded-md">
                <p className="text-base">{adData.descriptions[selectedDescIndex]}</p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyText(adData.descriptions[selectedDescIndex], 'Опис')}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Копіювати
                  </Button>
                </div>
              </div>
            </Tabs>
          </Card>
          
          {/* Зображення */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Зображення</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adData.images.map((image, index) => (
                <div key={`image-${index}`} className="border rounded-lg overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${image}`} 
                    alt={`Google Ad Image ${index + 1}`} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyImage(index)}
                    >
                      {copiedImage === index ? (
                        <><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Скопійовано</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Копіювати</>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadImage(index)}
                    >
                      <Download className="h-4 w-4 mr-1" /> Завантажити
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default GoogleAd;
