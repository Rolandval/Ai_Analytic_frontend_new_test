import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Send, 
  Mic, 
  MicOff, 
  Brain,
  User,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface SuggestedQuestion {
  text: string;
  category: string;
}

export default function BusinessAgentChat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions: SuggestedQuestion[] = [
    { text: 'Який прогноз продажів на наступний квартал?', category: 'Продажі' },
    { text: 'Які основні ризики для бізнесу зараз?', category: 'Ризики' },
    { text: 'Як оптимізувати витрати на маркетинг?', category: 'Маркетинг' },
    { text: 'Порівняй нашу ефективність з конкурентами', category: 'Аналітика' },
    { text: 'Які тренди на ринку варто врахувати?', category: 'Тренди' },
    { text: 'Дай рекомендації щодо розвитку команди', category: 'HR' }
  ];

  useEffect(() => {
    // Перевірка параметра запиту з Dashboard
    const query = searchParams.get('q');
    if (query) {
      const questionMap: Record<string, string> = {
        'sales-risks': 'Які ризики в відділі продажів цього місяця?',
        'market-forecast': 'Зробити прогноз ринку на 6 місяців',
        'marketing-comparison': 'Порівняти наш маркетинг з конкурентом X'
      };
      
      const question = questionMap[query];
      if (question) {
        handleSendMessage(question);
      }
    }

    // Привітальне повідомлення
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Привіт! Я ваш AI Business Agent. Я можу допомогти з аналітикою, стратегією, прогнозами та відповісти на будь-які питання про ваш бізнес. Що вас цікавить?',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Симуляція відповіді AI
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(messageText),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const responses: Record<string, string> = {
      'прогноз': `На основі аналізу поточних трендів та історичних даних:

📈 **Прогноз на наступний квартал:**
• Очікуване зростання продажів: +15-18%
• Ключові драйвери: сезонність, нові продукти, розширення ринку
• Потенційні ризики: коливання курсу валют, конкуренція

**Рекомендації:**
1. Збільшити запаси популярних товарів на 20%
2. Запустити маркетингову кампанію за 2 тижні до піку сезону
3. Підготувати додаткову логістику для обробки замовлень`,

      'ризики': `🔴 **Основні ризики для бізнесу:**

1. **Фінансові ризики:**
   • Затримки платежів від ключових клієнтів (30% дебіторки)
   • Коливання курсу валют (вплив на імпортні товари)

2. **Операційні ризики:**
   • Залежність від одного постачальника (45% товарів)
   • Недостатня автоматизація процесів

3. **Ринкові ризики:**
   • Активізація конкурентів (зростання на 5.5%)
   • Зміна споживчих переваг

**План мітигації:**
• Диверсифікація постачальників
• Впровадження системи раннього попередження
• Створення резервного фонду`,

      'маркетинг': `💡 **Оптимізація маркетингових витрат:**

**Поточна ситуація:**
• ROI маркетингу: 3.2x
• Найефективніші канали: Google Ads (4.5x), Facebook (3.8x)
• Неефективні: банерна реклама (0.8x)

**Рекомендації:**
1. Перерозподілити 30% бюджету з банерів на Google Ads
2. Впровадити A/B тестування для всіх кампаній
3. Фокус на ретаргетинг (ROI 5.2x)
4. Збільшити інвестиції в контент-маркетинг

**Очікувана економія:** $15,000/місяць
**Очікуване зростання ROI:** до 4.1x`
    };

    const lowerQuestion = question.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
      if (lowerQuestion.includes(key)) {
        return response;
      }
    }

    return `Аналізую ваше питання: "${question}"

Для надання точної відповіді мені потрібно більше контексту. Будь ласка, уточніть:
• Який період вас цікавить?
• Які конкретні метрики важливі?
• Чи є специфічні обмеження або вимоги?

Я можу допомогти з аналітикою, прогнозами, оптимізацією процесів та стратегічними рекомендаціями.`;
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Тут буде інтеграція з Web Speech API
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Бічна панель з пропозиціями */}
      <div className="w-80 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
          Швидкі питання
        </h3>
        <div className="space-y-2">
          {suggestedQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(q.text)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-xs text-primary font-medium mb-1">
                {q.category}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {q.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Основний чат */}
      <div className="flex-1 flex flex-col">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                AI Business Agent
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Завжди онлайн • Готовий допомогти
              </p>
            </div>
          </div>
        </div>

        {/* Повідомлення */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-2xl p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.content)}
                      className="h-7 px-2"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Копіювати
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Аналізую дані...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Поле вводу */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              className={isRecording ? 'bg-red-50 dark:bg-red-900/20' : ''}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Задайте питання про ваш бізнес..."
              className="flex-1"
              disabled={isLoading}
            />
            
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
