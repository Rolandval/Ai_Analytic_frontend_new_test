export interface ChatModel {
  id: number;
  name: string;
  icon: string;
  input_tokens_price: number;
  output_tokens_price: number;
  max_tokens_count?: number;
  openrouter_model?: string;
}

export interface ChatModelCreatePayload {
  name: string;
  openrouter_model: string;
  max_tokens_count: number;
  input_tokens_price: number;
  output_tokens_price: number;
  icon_url: string;
}

export interface ChatModelUpdatePayload extends ChatModelCreatePayload {
  id: number;
}
