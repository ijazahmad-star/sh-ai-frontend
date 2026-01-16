export interface Source {
  source: string;
  content: string;
  rerank_score?: number;
}

export interface AIResponse {
  response: string;
  sources: Source[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt?: Date | string;
  user_query?: string;
  conversation_id?: string;
  user_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: Message[];
}
