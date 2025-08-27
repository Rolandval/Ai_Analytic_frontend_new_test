import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import gptLogo from './img/ChatGPT_logo.svg.png';

export default function AIProductFillerSettings() {
  const [apiKey, setApiKey] = useState('sk-None-vhQ3gPR22u5wqQWg3');
  const [model, setModel] = useState('gpt-5');
  const [presencePenalty1, setPresencePenalty1] = useState('0');
  const [temperature, setTemperature] = useState('');
  const [topP, setTopP] = useState('0');
  const [presencePenalty2, setPresencePenalty2] = useState('1.0');
  const [prompt, setPrompt] = useState('');

  const handleSave = () => {
    console.log('Налаштування збережено:', {
      apiKey,
      model,
      presencePenalty1,
      temperature,
      topP,
      presencePenalty2,
    });
  };

  return (
    <div className="container mx-auto px-6 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">ChatGPT AI Generator</h1>
        <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">
          Зберегти
        </Button>
      </div>

      {/* API Key Section */}
      <Card className="p-6 mb-6 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col space-y-3">
          <Label htmlFor="api-key" className="text-lg font-semibold">API-ключ</Label>
          <Input
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-white dark:bg-gray-700"
          />
          <p className="text-sm text-muted-foreground">
            Ключ до API платформи ChatGPT можна отримати тут: https://platform.openai.com/account/api-keys
          </p>
        </div>
      </Card>

      {/* Advanced Settings Section */}
      <h2 className="text-2xl font-semibold mb-4">Розширені налаштування</h2>
      <Card className="p-6 mb-6 bg-gray-50 dark:bg-gray-800">
        <div className="space-y-6">
          {/* Model */}
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
            <Label htmlFor="model" className="font-medium pt-2">Модель</Label>
            <div className="space-y-2">
              <Input 
                id="model" 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-muted-foreground">
                Використаний ідентифікатор моделі, найкращий на даний момент: gpt-3.5-turbo. Ви можете переглянути список моделей тут: https://platform.openai.com/docs/models
              </p>
            </div>
          </div>

          {/* presence_penalty (first) */}
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
            <Label htmlFor="presence1" className="font-medium pt-2">presence_penalty</Label>
            <div className="space-y-2">
              <Input 
                id="presence1" 
                type="number" 
                min="-2" 
                max="2" 
                step="0.1" 
                value={presencePenalty1} 
                onChange={(e) => setPresencePenalty1(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-muted-foreground">
                Щоб створити зображення, будь ласка, очистіть тему зображення. Як тільки зображення буде створено, ви можете клікнути на нього, щоб скопіювати посилання, яке потім можна використовувати для додавання зображення продукту.
              </p>
            </div>
          </div>

          {/* temperature */}
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
            <Label htmlFor="temperature" className="font-medium pt-2">температура</Label>
            <div className="space-y-2">
              <Input 
                id="temperature" 
                type="number" 
                min="0" 
                max="2" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-muted-foreground">
                Яку температуру вибрати, від 0 до 2. Вищі значення, такі як 0.8, зроблять вихід більш випадковим, тоді як нижчі значення, наприклад 0.2, зроблять його більш спрямованим і визначеним. Зазвичай ми рекомендуємо змінювати це або top_p, але не обидва.
              </p>
            </div>
          </div>

          {/* top_p */}
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
            <Label htmlFor="topP" className="font-medium pt-2">top_p</Label>
            <div className="space-y-2">
              <Input 
                id="topP" 
                type="number" 
                min="0" 
                max="1" 
                step="0.1" 
                value={topP} 
                onChange={(e) => setTopP(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-muted-foreground">
                Альтернатива вибірковому вибірковому зразку, відомому як вибірковий зразок ядра, де модель враховує результати токенів з імовірністю top_p. Таким чином, 0.1 означає, що враховуються лише токени, що складають верхній 10% ймовірності. Зазвичай ми рекомендуємо змінювати це або температуру, але не обидва.
              </p>
            </div>
          </div>

          {/* presence_penalty (second) */}
          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
            <Label htmlFor="presence2" className="font-medium pt-2">presence_penalty</Label>
            <div className="space-y-2">
              <Input 
                id="presence2" 
                type="number" 
                min="-2" 
                max="2" 
                step="0.1" 
                value={presencePenalty2} 
                onChange={(e) => setPresencePenalty2(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
              <p className="text-sm text-muted-foreground">
                Число від -2.0 до 2.0. Позитивні значення штрафують нові токени на основі їх входження в текст до цього моменту, збільшуючи ймовірність моделі говорити про нові теми.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Section */}
      <h2 className="text-2xl font-semibold mb-4">ЗАПИТАЙТЕ У ЧАТ GPT</h2>
      <Card className="p-6 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Введіть питання"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-white dark:bg-gray-700"
            />
            <Button className="bg-green-900 hover:bg-green-800 text-white">
              Введіть
            </Button>
          </div>
          <div className="w-[50px] h-[50px] flex items-center justify-center">
             <img src={gptLogo} alt="gpt logo" />
          </div>
        </div>
      </Card>
    </div>
  );
}
