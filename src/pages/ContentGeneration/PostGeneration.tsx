import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { generatePostDescription, GeneratePostDescriptionResponse } from "@/services/contentGeneration.api";
import { useTheme } from "@/hooks/useTheme";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";



const PostGeneration: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratePostDescriptionResponse | null>(null);

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Помилка",
        description: "Будь ласка, введіть назву товару",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = await generatePostDescription({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setResult(data);
      toast({
        title: "Успіх",
        description: "Опис товару успішно згенеровано!"
      });
    } catch (error) {
      console.error("Error generating post description:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося згенерувати опис товару. Спробуйте знову пізніше.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-2">Генерація опису товару для сайту</h2>
      <p className="text-muted-foreground mb-6">
        Введіть назву товару та опціонально короткий опис, щоб згенерувати повний SEO-оптимізований опис для сайту
      </p>

      <Card className={`${isDarkMode ? 'bg-[#141414]' : 'bg-white'} mb-4 p-6`}>
        <div className="mb-4">
          <label className="font-semibold block mb-2">Назва товару *</label>
          <Input 
            placeholder="Наприклад: Сонячна панель JA Solar JAM60S20 380W" 
            value={title} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
            className="w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="font-semibold block mb-2">Короткий опис (необов'язково)</label>
          <Textarea 
            placeholder="Додаткова інформація про товар" 
            value={description} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} 
            rows={4}
            className="w-full"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!title.trim() || loading}
          className="flex items-center"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Згенерувати опис
        </Button>
      </Card>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
            <p>Генерація опису...</p>
          </div>
        </div>
      )}

      {result && !loading && (
        <Card className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f9f9f9]'} mt-6 p-6`}>
          <h3 className="text-2xl font-bold mb-4">Результат генерації</h3>
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Заголовок</h4>
            <p className="font-medium">{result.title}</p>
          </div>
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Короткий опис</h4>
            <p>{result.short_description}</p>
          </div>
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Повний опис</h4>
            <div className="markdown-content prose dark:prose-invert max-w-none">
              <ReactMarkdown>{result.full_description}</ReactMarkdown>
            </div>
          </div>
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Промо-текст</h4>
            <p className="italic">{result.promo_text}</p>
          </div>
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Ключові слова для SEO</h4>
            <div className="flex flex-wrap gap-2">
              {result.search_keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-primary/20 text-sm rounded-md">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          {result.short_video_url && (
            <div className="mb-4 border-b pb-4">
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">Коротке відео</h4>
              <a 
                href={result.short_video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {result.short_video_url}
              </a>
            </div>
          )}
          
          {result.video_review_url && (
            <div className="mb-4 border-b pb-4">
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">Відео-огляд</h4>
              <a 
                href={result.video_review_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {result.video_review_url}
              </a>
            </div>
          )}
          
          <div className="mb-4 border-b pb-4">
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">Відгуки</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ім'я</th>
                    <th className="text-left p-2">Відгук</th>
                    <th className="text-left p-2">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {result.reviews.map((review, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{review.name}</td>
                      <td className="p-2 max-w-md break-words">{review.text}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-md text-white ${parseInt(review.rating) > 3 ? 'bg-green-500' : parseInt(review.rating) > 1 ? 'bg-orange-500' : 'bg-red-500'}`}>
                          {review.rating}/5
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {result.similar_products && result.similar_products.length > 0 && (
            <div className="mb-4 border-b pb-4">
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">Схожі товари</h4>
              <ul className="list-disc pl-5">
                {result.similar_products.map((product, index) => (
                  <li key={index}>{product}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6 flex gap-2">
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(result.full_description);
                toast({
                  title: "Успіх",
                  description: "Повний опис скопійовано!"
                });
              }}
            >
              Копіювати повний опис
            </Button>
            <Button 
              variant="outline"
              onClick={() => setResult(null)}>
              Очистити результат
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PostGeneration;
