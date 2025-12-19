import { NextRequest, NextResponse } from 'next/server';
import { openai, models, temperatures } from '@/lib/ai/openai';
import { PRODUCT_AGENT_PROMPT, formatSystemPrompt } from '@/lib/ai/prompts/system';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  generateEmbedding,
  searchSimilarContent,
  searchFAQs
} from '@/lib/ai/embeddings';
import { chatRequestSchema, parseRequestBody, ChatMessage } from '@/lib/validations';

interface ProductResult {
  id?: string;
  name?: string;
  brand?: string;
  price?: number;
  width?: number;
  profile?: number;
  diameter?: number;
  similarity?: number;
  [key: string]: unknown;
}

interface SemanticResult {
  product?: ProductResult;
  similarity: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface ChatContext {
  products?: ProductResult[];
  faqs?: FAQItem[];
}

// Helper to search for relevant products based on user query
async function searchProducts(query: string) {
  try {
    // Try semantic search first
    const queryEmbedding = await generateEmbedding(query);
    const semanticResults = await searchSimilarContent(queryEmbedding, {
      matchThreshold: 0.65,
      matchCount: 10,
      contentType: 'product',
    });

    const results = semanticResults as SemanticResult[];
    if (results && results.length > 0) {
      return results
        .filter((r) => r.product)
        .map((r) => ({ ...r.product, similarity: r.similarity }));
    }
  } catch (error) {
    console.log('Semantic search failed, falling back to keyword search');
  }

  // Fallback to keyword search
  // Extract potential tire size from query
  const sizePattern = /(\d{3})\/(\d{2})[R\/]?(\d{2})/i;
  const sizeMatch = query.match(sizePattern);

  let products = [];

  if (sizeMatch) {
    // Search by exact size
    const width = parseInt(sizeMatch[1]);
    const profile = parseInt(sizeMatch[2]);
    const diameter = parseInt(sizeMatch[3]);

    const { data } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('width', width)
      .eq('profile', profile)
      .eq('diameter', diameter)
      .order('price', { ascending: true })
      .limit(10);

    products = data || [];
  } else {
    // Search by brand or general terms
    const searchTerms = query.toLowerCase().split(' ');
    const brandTerms = ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone'];
    const foundBrand = brandTerms.find(brand => searchTerms.some(term => brand.includes(term)));

    if (foundBrand) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('*')
        .ilike('brand', `%${foundBrand}%`)
        .order('price', { ascending: true })
        .limit(10);

      products = data || [];
    } else {
      // Get popular products as fallback
      const { data } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('price', { ascending: true })
        .limit(5);

      products = data || [];
    }
  }

  return products;
}

// Helper to determine if the query needs product search
function needsProductSearch(query: string): boolean {
  const productKeywords = [
    'neumático', 'neumatico', 'llanta', 'goma', 'cubierta',
    'precio', 'costo', 'vale', 'sale',
    'tiene', 'tienen', 'hay', 'disponible',
    'medida', 'tamaño', 'rodado',
    'marca', 'bridgestone', 'pirelli', 'michelin', 'goodyear',
    'necesito', 'busco', 'quiero', 'comprar'
  ];

  const lowerQuery = query.toLowerCase();
  return productKeywords.some(keyword => lowerQuery.includes(keyword)) ||
         /\d{3}\/\d{2}[R\/]?\d{2}/i.test(query); // Check for tire size pattern
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body with Zod
    const validation = await parseRequestBody(request, chatRequestSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { messages, stream } = validation.data;

    // Get the last user message
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === 'user').pop();

    const context: ChatContext = {};

    // Search for products if needed
    if (lastUserMessage && needsProductSearch(lastUserMessage.content)) {
      const products = await searchProducts(lastUserMessage.content);
      if (products.length > 0) {
        context.products = products;
      }
    }

    // Search FAQs for relevant information
    if (lastUserMessage) {
      try {
        const faqs = await searchFAQs(lastUserMessage.content, 3);
        if (faqs.length > 0) {
          context.faqs = faqs;
        }
      } catch (error) {
        console.log('FAQ search failed:', error);
      }
    }

    // Prepare the system prompt with context
    const systemPrompt = formatSystemPrompt(PRODUCT_AGENT_PROMPT, context);

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    if (stream) {
      // Create a streaming response
      const response = await openai.chat.completions.create({
        model: models.chat, // Using GPT-4 for better responses
        messages: openaiMessages,
        temperature: temperatures.balanced,
        max_tokens: 1000,
        stream: true,
      });

      // Convert to ReadableStream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                const data = JSON.stringify({ content });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await openai.chat.completions.create({
        model: models.chat,
        messages: openaiMessages,
        temperature: temperatures.balanced,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';

      return NextResponse.json({
        content,
        usage: response.usage,
        model: response.model,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's an OpenAI API key error
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request', details: errorMessage },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'AI Chat API',
    models: {
      chat: models.chat,
      fast: models.fast,
      embeddings: models.embeddings,
    },
    timestamp: new Date().toISOString(),
  });
}