import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useGenerateFBPostMutation } from '@/services/adsManager/facebook.api';
import { Loader2, Download, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const FacebookPost = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [selectedTextIndex, setSelectedTextIndex] = useState(0);
  const [selectedDescIndex, setSelectedDescIndex] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'text' | 'images' | null>(null);
  const [copiedImage, setCopiedImage] = useState<number | null>(null);
  const { toast } = useToast();

  const [generatePost, { data: postData, isLoading }] = useGenerateFBPostMutation();

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
      await generatePost({ title, description }).unwrap();
    } catch (error) {
      toast({
        title: 'Помилка генерації',
        description: 'Не вдалося згенерувати контент. Спробуйте пізніше.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyImage = (index: number) => {
    if (postData?.images[index]) {
      const img = postData.images[index];
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
    if (postData?.images[index]) {
      const img = postData.images[index];
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${img}`;
      link.download = `facebook-post-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-500">Генерація постів Facebook</h1>
      
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
              placeholder="Введіть додатковий опис, особливості, переваги товару або послуги"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !title.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingPhase === 'text' ? 'Генерація тексту...' : 'Генерація зображень...'}
              </span>
            ) : 'Згенерувати'}
          </Button>
        </form>
      </Card>
      
      {postData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Заголовки */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Заголовки</h2>
            <Tabs 
              defaultValue="0" 
              value={selectedTitleIndex.toString()} 
              onValueChange={(value) => setSelectedTitleIndex(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 mb-4">
                {postData.titles.map((_, index) => (
                  <TabsTrigger 
                    key={`title-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {postData.titles.map((title, index) => (
                <TabsContent key={`title-content-${index}`} value={index.toString()} className="p-4 bg-secondary/30 rounded-md">
                  <p className="text-lg font-medium">{title}</p>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(title);
                        toast({ title: 'Скопійовано', description: 'Текст скопійовано в буфер обміну.' });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Копіювати
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
          
          {/* Основні тексти */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Основні тексти</h2>
            <Tabs 
              defaultValue="0" 
              value={selectedTextIndex.toString()} 
              onValueChange={(value) => setSelectedTextIndex(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 mb-4">
                {postData.texts.map((_, index) => (
                  <TabsTrigger 
                    key={`text-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {postData.texts.map((text, index) => (
                <TabsContent key={`text-content-${index}`} value={index.toString()} className="p-4 bg-secondary/30 rounded-md">
                  <p className="text-base">{text}</p>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(text);
                        toast({ title: 'Скопійовано', description: 'Текст скопійовано в буфер обміну.' });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Копіювати
                    </Button>
                  </div>
                </TabsContent>
              ))}
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
                {postData.descriptions.map((_, index) => (
                  <TabsTrigger 
                    key={`desc-tab-${index}`} 
                    value={index.toString()}
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {postData.descriptions.map((desc, index) => (
                <TabsContent key={`desc-content-${index}`} value={index.toString()} className="p-4 bg-secondary/30 rounded-md">
                  <p className="text-base">{desc}</p>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(desc);
                        toast({ title: 'Скопійовано', description: 'Текст скопійовано в буфер обміну.' });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Копіювати
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
          
          {/* Зображення */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-orange-500">Зображення</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {postData.images.map((image, index) => (
                <div key={`image-${index}`} className="border rounded-lg overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${image}`} 
                    alt={`Facebook Post Image ${index + 1}`} 
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

export default FacebookPost;
