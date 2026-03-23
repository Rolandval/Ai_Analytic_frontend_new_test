import { apiClient } from "@/lib/api-client";

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

const BASE = "/chat";

export const chatApi = {
  async getChats() {
    const { data } = await apiClient.get<{ chats: Chat[] }>(`${BASE}/chats`);
    return data.chats;
  },
  async createChat(name: string, model: string) {
    const { data } = await apiClient.post<Chat>(`${BASE}/create-chat/`, { name, model });
    return data;
  },
  async updateChatName(id: number, name: string) {
    await apiClient.patch(`${BASE}/chat-update-name/${id}`, null, { params: { name } });
  },
  async switchChatModel(id: number, model: string) {
    await apiClient.patch(`${BASE}/chat-switch-model/${id}`, null, { params: { model } });
  },
  async deleteChat(id: number) {
    await apiClient.delete(`${BASE}/chat-delete/${id}`);
  },
  async getModels() {
    const { data } = await apiClient.get<ChatModel[]>(`${BASE}/chat-models`);
    return data;
  },
  async sendMessage(payload: SendMessagePayload) {
    const { data } = await apiClient.post<{ reply: string }>(`${BASE}/chat`, payload);
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
