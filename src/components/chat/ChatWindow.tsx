import { useChatStore } from "@/store/chatStore";
import { motion } from "framer-motion";
import "@/styles/chat-animations.css";
import { Send, Loader2, Copy, Check, User, Bot, Clock, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { OpenRouterBalance } from "./OpenRouterBalance";

export const ChatWindow = () => {
  const { currentChatId, messages, sendMessage, models, switchModel, chats } = useChatStore();
  const currentChat = chats.find((c) => c.id === currentChatId);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [useExtension, setUseExtension] = useState(false);

  // Типи для Web Speech API
  interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEventType) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }
  
  interface SpeechRecognitionEventType {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
      length: number;
    };
  }
  
  // voice recognition setup
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  
  // Перевірка підтримки голосового введення
  const isVoiceSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const handleVoiceClick = () => {
    if (!isVoiceSupported) return;
    setRecording(true);
    
    // Create speech recognition instance
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recognitionRef.current = recog;
    
    recog.lang = "uk-UA";
    recog.interimResults = true;
    
    // Handle results
    recog.onresult = (event: SpeechRecognitionEventType) => {
      const transcript = Array.from(Array.from({length: event.results.length}, (_, i) => event.results[i]))
        .map(result => result[0].transcript)
        .join('');
      
      setInput(transcript);
    };
    
    // Handle end of speech
    recog.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };
    
    // Start
    recog.start();
  };

  // auto-scroll with smooth animation
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, currentChatId]);
  
  // Format timestamp
  const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Handle copying message content
  const handleCopyContent = (id: string, content: string) => {
    // Використовуємо альтернативний метод копіювання для більшої надійності
    try {
      // Спочатку пробуємо стандартний Clipboard API
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopiedMsgId(id);
          setTimeout(() => setCopiedMsgId(null), 2000);
        })
        .catch(err => {
          console.error('Clipboard API failed, trying fallback:', err);
          // Резервний метод з використанням невидимого textarea
          fallbackCopyToClipboard(content, id);
        });
    } catch (err) {
      console.error('Copy operation error:', err);
      fallbackCopyToClipboard(content, id);
    }
  };

  // Резервний метод копіювання через textarea
  const fallbackCopyToClipboard = (text: string, id?: string) => {
    try {
      // Створюємо тимчасовий textarea елемент
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Налаштовуємо стилі, щоб елемент був невидимим
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      
      // Додаємо до DOM, фокусуємося і виділяємо текст
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      // Виконуємо команду копіювання
      const successful = document.execCommand('copy');
      
      // Видаляємо тимчасовий елемент
      document.body.removeChild(textarea);
      
      // Показуємо результат користувачу
      if (successful && id) {
        setCopiedMsgId(id);
        setTimeout(() => setCopiedMsgId(null), 2000);
      }
    } catch (err) {
      console.error('Fallback copy method failed:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;
    
    // Негайно очищаємо поле введення
    const messageText = input.trim();
    setInput("");
    
    // Додаємо індикатор очікування
    setTyping(true);
    
    try {
      await sendMessage(messageText, useExtension);
    } catch (error) {
      console.error("Error sending message:", error);
      // Додаємо повідомлення про помилку безпосередньо в чат
      const errorMessage = 
        error instanceof Error 
          ? `Помилка: ${error.message}` 
          : 'Виникла помилка при отриманні відповіді. Спробуйте ще раз.';
      
      // Додаємо локальне повідомлення про помилку до чату
      if (currentChatId) {
        // Можна використати свій метод додавання повідомлення про помилку
        // Або додати кастомний обробник помилок до вашого стору
        console.error("Помилка під час отримання відповіді:", errorMessage);
      }
    } finally {
      setTyping(false);
    }
  };

  const msgs = currentChatId ? messages[currentChatId] || [] : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header area with balance and model info */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {/* Показуємо назву поточного чату або стандартну назву */}
            {currentChat?.name || 'Новий чат'}
          </h2>
          <OpenRouterBalance />
        </div>
        <p className="text-xs text-gray-400">
          Ваш персональний помічник з використанням найсучасніших моделей штучного інтелекту.
          Ставте будь-які питання та отримуйте швидкі, точні відповіді.
        </p>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col" ref={containerRef}>
        {msgs.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "group flex gap-3 p-4 rounded-lg max-w-[90%]",
              msg.role === "user"
                ? "bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 self-end"
                : "bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-white/10 self-start"
            )}
          >
            {/* Avatar icon */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === "user"
                ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                : "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            {/* Message content with improved styling */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-sm">
                  {msg.role === "user" ? "Ви" : currentChat?.model || "AI"}
                </div>
                
                {/* Message actions */}
                <div className="flex items-center space-x-1">
                  {/* Time */}
                  <div className="text-gray-400 text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatTime(Date.now())}</span>
                  </div>
                  
                  {/* Copy button */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopyContent(msg.id, msg.content)}
                  >
                    {copiedMsgId === msg.id ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
              
              {/* Message text with markdown support */}
              <div className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Індикатор набору тексту - відображається коли typing=true */}
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 p-4 rounded-lg bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-white/10 self-start max-w-[90%]"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300">
              <Bot className="w-4 h-4" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="font-semibold text-sm">
                  {currentChat?.model || "AI"}
                </div>
              </div>
              
              <div className="text-sm whitespace-pre-wrap break-words flex items-center">
                <div className="typing-animation">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Input area with improved styling */}
      {currentChatId ? (
        <div className="flex flex-col gap-2 p-4">
          {/* Extension checkbox */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer select-none text-sm text-gray-400 hover:text-gray-300">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4 rounded border-gray-600 bg-white/5 text-purple-500 focus:ring-purple-500"
                checked={useExtension}
                onChange={(e) => setUseExtension(e.target.checked)}
              />
              Використовувати розширення
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-1 flex items-center bg-white/5 backdrop-blur-xl rounded-full px-4 py-2",
              "border transition-all duration-200 flex-grow",
              isInputFocused 
                ? "border-purple-500/50 ring-1 ring-purple-500/30 bg-white/10" 
                : "border-white/10 hover:border-white/20"
            )}>
              <TextareaAutosize
                className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm placeholder:text-gray-500 max-h-40"
                minRows={1}
                maxRows={6}
                placeholder="Введіть повідомлення..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              
              <Button 
                onClick={handleVoiceClick} 
                variant="ghost"
                className="h-8 w-8 p-0 mr-1" 
                disabled={recording}
              >
                {recording ? 
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : 
                  <Mic className="w-4 h-4 text-gray-400" />}
              </Button>
            </div>
            
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || typing}
              className={cn(
                "rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600",
                "text-white shadow-lg transition-all duration-300 flex-shrink-0",
                "h-10 w-10 p-0 flex items-center justify-center"
              )}
            >
              {typing ? 
                <Loader2 className="w-4 h-4 animate-spin" /> :
                <Send className="w-4 h-4" />
              }
            </Button>
            
            {/* Model switcher with improved styling */}
            <Select value={currentChat?.model} onValueChange={(v)=> currentChatId && switchModel(currentChatId, v)}>
              <SelectTrigger className="rounded-full text-xs px-2 py-1 border-white/10 bg-white/5 hover:bg-white/10 w-auto flex-shrink-0 max-w-[100px]">
                <SelectValue placeholder="AI" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border border-white/10 w-auto max-w-[150px]">
                {models.map(m=>(
                  <SelectItem key={m.id} value={m.name} className="focus:bg-white/10 text-xs">
                    <div className="flex items-center">
                      {m.icon && <img src={m.icon} alt={m.name} className="w-3 h-3 mr-1" />}
                      <span>{m.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground opacity-70 p-4">
          Виберіть або створіть чат
        </div>
      )}
    </div>
  );
};
