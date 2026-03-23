import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, QrCode, Download, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/Slider';
import './qr-code.css';

interface FormData {
  url: string;
  color1: string;
  color2: string;
  background_color: string;
  gradient: boolean;
  transparent: boolean;
  pixel_shape: 'square' | 'circle';
  eye_shape: 'frame' | 'circle' | 'rounded';
  size: number;
  logo?: File | null;
}

const QRCodeGenerator = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    url: '',
    color1: '#000000',
    color2: '#0277BD',
    background_color: '#FFFFFF',
    gradient: true,
    transparent: false,
    pixel_shape: 'square',
    eye_shape: 'frame',
    size: 800,
    logo: null
  });
  
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSizeChange = (value: number[]) => {
    setFormData({ ...formData, size: value[0] });
  };
  
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, logo: e.target.files[0] });
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setQrCodeImage(null);
    
    try {
      const data = new FormData();
      data.append('url', formData.url);
      data.append('color1', formData.color1);
      data.append('color2', formData.color2);
      data.append('background_color', formData.background_color);
      data.append('gradient', formData.gradient.toString());
      data.append('transparent', formData.transparent.toString());
      data.append('pixel_shape', formData.pixel_shape);
      data.append('eye_shape', formData.eye_shape);
      data.append('size', formData.size.toString());
      
      if (formData.logo) {
        data.append('logo', formData.logo);
      }
      
      const response = await fetch('/characters/generate_qr', {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        throw new Error(`Помилка: ${response.status}`);
      }
      
      const result = await response.json();
      setQrCodeImage(result.qr_code_base64);
      toast({
        title: 'QR-код згенеровано',
        description: 'QR-код був успішно створений!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Помилка при генерації QR-коду:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося згенерувати QR-код. Спробуйте ще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr_code_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Генерація QR-кодів</h1>
          <p className="text-muted-foreground mt-2">
            Створіть унікальні QR-коди з вашим логотипом та налаштуваннями дизайну
          </p>
        </div>
        <QrCode className="w-12 h-12 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметри генерації</CardTitle>
            <CardDescription>
              Налаштуйте вигляд та функціональність QR-коду
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="qrForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">URL для кодування</Label>
                <div className="flex">
                  <div className="mr-2">
                    <Link2 className="w-4 h-4 mt-3 text-muted-foreground" />
                  </div>
                  <Input 
                    id="url" 
                    name="url" 
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="flex-1" 
                    required 
                  />
                </div>
              </div>

              <Tabs defaultValue="colors">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors">Кольори</TabsTrigger>
                  <TabsTrigger value="shape">Форма</TabsTrigger>
                  <TabsTrigger value="logo">Логотип</TabsTrigger>
                </TabsList>
                
                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="color1">Основний колір</Label>
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: formData.color1 }}
                      />
                    </div>
                    <Input 
                      id="color1" 
                      name="color1" 
                      type="color" 
                      value={formData.color1}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="color2">Другий колір (для градієнту)</Label>
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: formData.color2 }}
                      />
                    </div>
                    <Input 
                      id="color2" 
                      name="color2" 
                      type="color" 
                      value={formData.color2}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="background_color">Колір фону</Label>
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: formData.background_color }}
                      />
                    </div>
                    <Input 
                      id="background_color" 
                      name="background_color" 
                      type="color" 
                      value={formData.background_color}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="gradient" 
                      name="gradient"
                      checked={formData.gradient}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, gradient: checked === true })
                      }
                    />
                    <Label htmlFor="gradient">Використовувати градієнт</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="transparent" 
                      name="transparent"
                      checked={formData.transparent}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, transparent: checked === true })
                      }
                    />
                    <Label htmlFor="transparent">Прозорий фон</Label>
                  </div>
                </TabsContent>
                
                <TabsContent value="shape" className="space-y-4">
                  <div>
                    <Label htmlFor="pixel_shape" className="block mb-2">Форма пікселів</Label>
                    <RadioGroup 
                      defaultValue={formData.pixel_shape}
                      onValueChange={(value) => handleSelectChange('pixel_shape', value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="square" id="pixel_square" />
                        <Label htmlFor="pixel_square">Квадрат</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="circle" id="pixel_circle" />
                        <Label htmlFor="pixel_circle">Коло</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="eye_shape" className="block mb-2">Форма кутових елементів</Label>
                    <RadioGroup 
                      defaultValue={formData.eye_shape}
                      onValueChange={(value) => handleSelectChange('eye_shape', value)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="frame" id="eye_frame" />
                        <Label htmlFor="eye_frame">Стандартна</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="circle" id="eye_circle" />
                        <Label htmlFor="eye_circle">Кругла</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rounded" id="eye_rounded" />
                        <Label htmlFor="eye_rounded">Заокруглена</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="size">Розмір: {formData.size}px</Label>
                    </div>
                    <Slider
                      defaultValue={[formData.size]}
                      max={1200}
                      min={200}
                      step={50}
                      onValueChange={handleSizeChange}
                      className="py-4"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="logo" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Логотип (опціонально)</Label>
                    <Input 
                      id="logo" 
                      name="logo" 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Рекомендований розмір: 200x200px, прозорий фон.
                      Підтримуються формати: PNG, JPG, SVG.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              form="qrForm" 
              type="submit" 
              disabled={isLoading || !formData.url} 
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерація...
                </>
              ) : (
                'Згенерувати QR-код'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Результат</CardTitle>
            <CardDescription>
              Згенерований QR-код для вашого посилання
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Генеруємо ваш QR-код...</p>
              </div>
            ) : qrCodeImage ? (
              <div className="flex flex-col items-center">
                <img 
                  src={qrCodeImage} 
                  alt="Generated QR Code"
                  className={cn(
                    "max-w-full object-contain",
                    formData.transparent ? "bg-grid-pattern" : ""
                  )}
                  style={{ maxHeight: '400px' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <QrCode className="h-16 w-16 text-muted-foreground/30" />
                <div>
                  <p className="text-muted-foreground">QR-код буде відображено тут</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Заповніть форму ліворуч та натисніть "Згенерувати"</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {qrCodeImage && (
              <Button 
                variant="secondary"
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Завантажити
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
