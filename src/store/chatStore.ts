import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Chat, ChatModel, chatApi, openChatWebSocket } from "@/api/chatApi";

// Функція для генерації UUID, сумісна з різними браузерами та середовищами
function generateUUID(): string {
  // Використовуємо crypto.randomUUID якщо доступно
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Функція для генерації рандомного числа в шістнадцятковому форматі
  const getRandomHex = () => {
    // Перевіряємо наявність різних джерел випадковості
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buffer = new Uint8Array(1);
      crypto.getRandomValues(buffer);
      return buffer[0].toString(16).padStart(2, '0');
    } else {
      // Запасний варіант - використовуємо Math.random
      return Math.floor(Math.random() * 16).toString(16);
    }
  };

  // Формат UUID: 8-4-4-4-12 символів
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Версія 4 UUID
    } else if (i === 19) {
      uuid += (Math.floor(Math.random() * 4) + 8).toString(16); // Варіант - 8, 9, a, або b
    } else {
      uuid += getRandomHex();
    }
  }
  
  return uuid;
}

export interface ChatMessage {
  id: string; // uuid client side
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  chats: Chat[];
  models: ChatModel[];
  currentChatId: number | null;
  messages: Record<number, ChatMessage[]>; // keyed by chat id
  ws?: WebSocket;

  // actions
  fetchChats: () => Promise<void>;
  fetchModels: () => Promise<void>;
  createChat: (name: string, model: string) => Promise<void>;
  selectChat: (id: number) => void;
  sendMessage: (text: string, useExtension?: boolean) => Promise<void>;
  renameChat: (id: number, name: string) => Promise<void>;
  switchModel: (id: number, model: string) => Promise<void>;
  deleteChat: (id: number) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    chats: [],
    models: [],
    currentChatId: null,
    messages: {},

    async fetchChats() {
      const chats = await chatApi.getChats();
      set((s) => {
        s.chats = chats;
      });
    },
    async fetchModels() {
      const models = await chatApi.getModels();
      set((s) => {
        s.models = models;
      });
    },
    async createChat(name, model) {
      const chat = await chatApi.createChat(name, model);
      set((s) => {
        s.chats.push(chat);
      });
    },
    selectChat(id) {
      const { ws } = get();
      if (ws) ws.close();
      const newWs = openChatWebSocket(id);
      newWs.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        const reply = data.reply as string;
        set((s) => {
          s.messages[id] = s.messages[id] || [];
          s.messages[id].push({ id: generateUUID(), role: "assistant", content: reply });
        });
      };
      set((s) => {
        s.currentChatId = id;
        s.ws = newWs;
      });
    },
    async sendMessage(text, useExtension = false) {
      const state = get();
      const chatId = state.currentChatId;
      if (!chatId) return;
      // optimistic add
      set((s) => {
        s.messages[chatId] = s.messages[chatId] || [];
        s.messages[chatId].push({ id: generateUUID(), role: "user", content: text });
      });
      
      // Перевіряємо, що WebSocket дійсно встановлений та відкритий
      // Використовуємо WebSocket тільки якщо він точно готовий до відправки
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        try {
          state.ws.send(JSON.stringify({ message: text, use_extention: useExtension }));
        } catch (err) {
          console.error("WebSocket send error:", err);
          // Якщо відправка через WebSocket не вдалася, використовуємо HTTP запит
          await fallbackToHttpRequest();
        }
      } else {
        // Використовуємо HTTP запит, якщо WebSocket не готовий
        await fallbackToHttpRequest();
      }
      
      // Функція для відправки повідомлення через HTTP
      async function fallbackToHttpRequest() {
        const chat = state.chats.find((c) => c.id === chatId);
        const model = chat?.model ?? undefined;
        try {
          const reply = await chatApi.sendMessage({ 
            chat_id: chatId, 
            message: text, 
            model,
            use_extention: useExtension 
          });
          set((s) => {
            s.messages[chatId].push({ id: generateUUID(), role: "assistant", content: reply });
          });
        } catch (error) {
          console.error("HTTP send message error:", error);
          // Додаємо повідомлення про помилку в чат
          set((s) => {
            s.messages[chatId].push({ 
              id: generateUUID(), 
              role: "assistant", 
              content: "Помилка відправки повідомлення. Спробуйте ще раз." 
            });
          });
        }
      }
    },
    async renameChat(id, name) {
      await chatApi.updateChatName(id, name);
      set((s) => {
        const chat = s.chats.find((c) => c.id === id);
        if (chat) chat.name = name;
      });
    },
    async switchModel(id, model) {
      await chatApi.switchChatModel(id, model);
      set((s) => {
        const chat = s.chats.find((c) => c.id === id);
        if (chat) chat.model = model;
        if (s.currentChatId === id) {
          s.messages[id] = [];
        }
      });
    },
    async deleteChat(id) {
      await chatApi.deleteChat(id);
      set((s) => {
        s.chats = s.chats.filter((c) => c.id !== id);
        delete s.messages[id];
        if (s.currentChatId === id) {
          s.currentChatId = null;
        }
      });
    },
  }))
);
