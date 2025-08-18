import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { FileUp, Download, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Item {
  name: string;
  unit: string;
  quantity: string;
  price: string;
  total: string;
}

interface InvoiceData {
  supplier_name: string;
  supplier_iban: string;
  buyer_name: string;
  items: Item[];
}

const InvoiceRecognition = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Приймаємо будь-який формат файлу
      setFile(selectedFile);
    } else {
      toast({
        variant: 'destructive',
        title: 'Помилка',
        description: 'Будь ласка, виберіть файл для завантаження',
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Помилка',
        description: 'Будь ласка, виберіть файл для завантаження',
      });
      return;
    }

    setIsLoading(true);
    setInvoiceData(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await axios.post<InvoiceData>('/reports/azure-invoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setInvoiceData(response.data);
        toast({
          title: 'Успішно',
          description: 'Накладну успішно розпізнано',
        });
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Помилка',
        description: 'Не вдалося розпізнати накладну. Спробуйте інший документ або перевірте формат файлу.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setInvoiceData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportToCSV = () => {
    if (!invoiceData) return;

    const headers = ['Назва', 'Одиниця виміру', 'Кількість', 'Ціна', 'Сума'];
    let csvContent = headers.join(',') + '\n';

    invoiceData.items.forEach(item => {
      const row = [
        `"${item.name || ''}"`,
        `"${item.unit || ''}"`,
        `"${item.quantity || ''}"`,
        `"${item.price || ''}"`,
        `"${item.total || ''}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoice_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!invoiceData) return;
    
    const jsonString = JSON.stringify(invoiceData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoice_data.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = (): string => {
    if (!invoiceData?.items) return '0';
    
    const total = invoiceData.items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total.replace(/\s+/g, '').replace(',', '.'));
      return isNaN(itemTotal) ? sum : sum + itemTotal;
    }, 0);
    
    return total.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-4 md:p-6 print:p-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 print:text-xl">Розпізнавання накладних</h1>
      
      <div className="print:hidden">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Завантажити накладну</CardTitle>
            <CardDescription>
              Оберіть файл накладної для автоматичного розпізнавання за допомогою AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-lg">
                  <label className="flex flex-col items-center cursor-pointer w-full">
                    <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground mb-2">
                      {file ? file.name : 'Перетягніть файл сюди або натисніть для вибору'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.jpg,.jpeg,.png,.tiff,.bmp,.gif,.docx,.xlsx,.csv,.xml,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button variant="outline" type="button">
                      Обрати файл
                    </Button>
                  </label>
                </div>
                <div className="flex flex-col gap-3 justify-center">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Розпізнавання...
                      </>
                    ) : (
                      'Розпізнати накладну'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Очистити
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoiceData && (
        <div className="print-container">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Результат розпізнавання</CardTitle>
              <CardDescription>
                Дані, отримані з накладної
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold mb-2">Дані постачальника</h3>
                  <div className="bg-secondary/40 p-4 rounded-lg">
                    <p><span className="font-medium">Назва:</span> {invoiceData.supplier_name || 'Не визначено'}</p>
                    <p><span className="font-medium">IBAN:</span> {invoiceData.supplier_iban || 'Не визначено'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Покупець</h3>
                  <div className="bg-secondary/40 p-4 rounded-lg">
                    <p>{invoiceData.buyer_name || 'Не визначено'}</p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-semibold mb-2">Товари/послуги</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Назва</TableHead>
                      <TableHead>Од. вим.</TableHead>
                      <TableHead>К-сть</TableHead>
                      <TableHead>Ціна</TableHead>
                      <TableHead>Сума</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.name || '-'}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell>{item.quantity || '-'}</TableCell>
                        <TableCell>{item.price || '-'}</TableCell>
                        <TableCell>{item.total || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell colSpan={5} className="text-right">Загалом:</TableCell>
                      <TableCell>{calculateTotal()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between print:hidden">
              <Button variant="outline" onClick={handleReset}>
                Очистити результат
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" onClick={exportToJSON}>
                  <Download className="mr-2 h-4 w-4" /> JSON
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Друк
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-t-primary animate-spin"></div>
            </div>
            <p className="text-lg font-medium">Розпізнавання документу...</p>
            <p className="text-sm text-muted-foreground text-center">
              Будь ласка, зачекайте. Процес може зайняти кілька секунд.
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .card {
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default InvoiceRecognition;
