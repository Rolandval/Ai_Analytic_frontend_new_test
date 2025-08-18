import { ChatModel, ChatModelCreatePayload } from "@/types/chatModels";

/**
 * Get all chat models
 */
export const getChatModels = async (): Promise<ChatModel[]> => {
  const response = await fetch('/chat/chat-models-list');
  
  if (!response.ok) {
    throw new Error(`Error fetching chat models: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Create a new chat model
 */
export const createChatModel = async (modelData: ChatModelCreatePayload): Promise<any> => {
  const response = await fetch('/chat/create-model/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(modelData),
  });
  
  if (!response.ok) {
    throw new Error(`Error creating chat model: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Update an existing chat model
 */
export const updateChatModel = async (id: number, modelData: ChatModelCreatePayload): Promise<any> => {
  const response = await fetch(`/chat/update-model/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(modelData),
  });
  
  if (!response.ok) {
    throw new Error(`Error updating chat model: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Delete a chat model
 */
export const deleteChatModel = async (id: number): Promise<any> => {
  const response = await fetch(`/chat/delete-model/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Error deleting chat model: ${response.statusText}`);
  }
  
  return await response.json();
};
