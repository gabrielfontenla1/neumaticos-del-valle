import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: process.env.OPENAI_ORG_ID,
});

// Model configurations
export const models = {
  // GPT-4 for complex queries and sales
  chat: process.env.OPENAI_MODEL_CHAT || 'gpt-4-0125-preview',

  // GPT-3.5 for fast responses and FAQs
  fast: process.env.OPENAI_MODEL_FAST || 'gpt-3.5-turbo-0125',

  // Embeddings model for semantic search
  embeddings: process.env.OPENAI_MODEL_EMBEDDINGS || 'text-embedding-3-small',
};

// Token limits per model
export const tokenLimits = {
  chat: 4096,
  fast: 4096,
  embeddings: 8191,
};

// Temperature settings for different use cases
export const temperatures = {
  precise: 0.3,      // For technical specifications
  balanced: 0.7,     // For general conversations
  creative: 0.9,     // For sales and recommendations
};