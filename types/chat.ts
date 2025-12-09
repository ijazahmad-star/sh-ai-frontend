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
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: Message[];
}

