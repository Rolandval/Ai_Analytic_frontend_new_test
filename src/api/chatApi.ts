import axios from "axios";

export interface Chat {
  id: number;
  name: string;
  model: string;
}

export interface ChatModel {
  id: number;
  name: string;
  icon: string;
}

export interface SendMessagePayload {
  chat_id: number;
  message: string;
  model?: string;
  new_session?: boolean;
  use_extention?: boolean;
}

// Використовуємо порожній BACKEND_ORIGIN, щоб працював проксі Vite в режимі розробки
// Налаштований проксі в vite.config.ts перенаправляє /chat на http://localhost:8002
const BACKEND_ORIGIN = "";

// Створюємо екземпляр axios з базовою URL для чат-API
const api = axios.create({
  baseURL: `/chat`,
});

// Small helper – drop leading slash so we never end up with /chat/chat, /chat/chats etc.
const endpoint = (path: string) => path.replace(/^\//, "");

export const chatApi = {
  async getChats() {
    const { data } = await api.get<{ chats: Chat[] }>(endpoint("chats"));
    return data.chats;
  },
  async createChat(name: string, model: string) {
    const { data } = await api.post<Chat>(endpoint("create-chat/"), { name, model });
    return data;
  },
  async updateChatName(id: number, name: string) {
    await api.patch(endpoint(`chat-update-name/${id}`), null, { params: { name } });
  },
  async switchChatModel(id: number, model: string) {
    await api.patch(endpoint(`chat-switch-model/${id}`), null, { params: { model } });
  },
  async deleteChat(id: number) {
    await api.delete(endpoint(`chat-delete/${id}`));
  },
  async getModels() {
    const { data } = await api.get<ChatModel[]>(endpoint("chat-models"));
    return data;
  },
  async sendMessage(payload: SendMessagePayload) {
    const { data } = await api.post<{ reply: string }>(endpoint("chat"), payload);
    return data.reply;
  },
};

export function openChatWebSocket(chatId: number) {
  try {
    // Визначаємо, на якому оточенні працює додаток (розробка чи виробництво)
    const isDevServer = window.location.host.includes('5173'); // Порт Vite dev сервера
    
    let wsUrl = '';
    
    if (isDevServer) {
      // На локальному середовищі підключаємось до бекенду через порт 8002
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const hostname = window.location.hostname; // без порту
      wsUrl = `${protocol}://${hostname}:8002/chat/ws/${chatId}`;
    } else {
      // На виробництві використовуємо поточний хост (з правильним портом бекенду якщо потрібно)
      // Якщо бекенд на тому ж домені, але іншому порту, вкажіть його явно
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.host;
      wsUrl = `${protocol}://${host}/chat/ws/${chatId}`;
    }
    
    console.log(`Спроба підключення до WebSocket: ${wsUrl}`);
    return new WebSocket(wsUrl);
  } catch (error) {
    console.error('Помилка при створенні WebSocket з\'єднання:', error);
    throw error;
  }
}
