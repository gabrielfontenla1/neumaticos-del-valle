// AI System Type Definitions

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  agent?: AgentType;
  confidence?: number;
  sources?: Source[];
}

export interface Source {
  type: 'product' | 'faq' | 'knowledge_base';
  id: string;
  relevance: number;
  content?: string;
}

export type AgentType = 'product' | 'faq' | 'sales' | 'technical' | 'orchestrator';

export interface ChatSession {
  id: string;
  userId?: string;
  messages: Message[];
  context?: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  products?: Product[];
  userIntent?: UserIntent;
  conversationTopic?: string;
  previousInteractions?: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  brand: string;
  width: number;
  profile: number;
  diameter: number;
  features?: any;
}

export interface UserIntent {
  type: 'purchase' | 'information' | 'technical' | 'comparison' | 'general';
  confidence: number;
  entities?: Entity[];
}

export interface Entity {
  type: 'product_size' | 'brand' | 'price_range' | 'quantity';
  value: string;
  confidence: number;
}

export interface AgentResponse {
  content: string;
  agent: AgentType;
  confidence: number;
  sources?: Source[];
  suggestedActions?: string[];
}

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    tokensUsed?: number;
    model?: string;
  };
}