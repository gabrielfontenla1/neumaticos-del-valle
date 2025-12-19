import { openai, models } from './openai';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Type definitions for embeddings
interface ProductForEmbedding {
  id: number
  brand: string
  model?: string
  width?: number
  profile?: number
  diameter?: number
  load_index?: string
  speed_index?: string
  season?: string
  vehicle_type?: string
  description?: string
  price: number
}

interface EmbeddingRecord {
  product_id?: number
  content: string
  content_type: string
  embedding: string
  metadata: Record<string, unknown>
  [key: string]: string | number | Record<string, unknown> | undefined
}

interface EmbeddingMatch {
  product_id?: number
  similarity: number
  metadata?: Record<string, unknown>
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

/**
 * Generate embedding for a given text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: models.embeddings,
      input: text.trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate text content for product embedding
 */
export function generateProductContent(product: ProductForEmbedding): string {
  const parts = [
    `Neumático ${product.brand} ${product.model || ''}`,
    `Medida: ${product.width}/${product.profile}R${product.diameter}`,
    product.load_index ? `Índice de carga: ${product.load_index}` : '',
    product.speed_index ? `Índice de velocidad: ${product.speed_index}` : '',
    product.season ? `Temporada: ${product.season}` : '',
    product.vehicle_type ? `Tipo de vehículo: ${product.vehicle_type}` : '',
    product.description || '',
    `Precio: $${product.price}`,
  ];

  return parts.filter(Boolean).join(' ');
}

/**
 * Store embedding in database
 */
export async function storeEmbedding(
  productId: number,
  content: string,
  embedding: number[],
  contentType: string = 'product'
) {
  try {
    const embeddingData: EmbeddingRecord = {
      product_id: productId,
      content,
      content_type: contentType,
      embedding: JSON.stringify(embedding),
      metadata: {
        model: models.embeddings,
        generated_at: new Date().toISOString(),
      },
    };

    // Use type assertion for tables not in generated types
    const { error } = await (supabaseAdmin
      .from('product_embeddings') as ReturnType<typeof supabaseAdmin.from>)
      .upsert(embeddingData as Record<string, unknown>, {
        onConflict: 'product_id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw new Error('Failed to store embedding');
  }
}

/**
 * Search for similar content using vector similarity
 */
export async function searchSimilarContent(
  queryEmbedding: number[],
  options: {
    matchThreshold?: number;
    matchCount?: number;
    contentType?: string;
  } = {}
) {
  const {
    matchThreshold = 0.7,
    matchCount = 10,
    contentType,
  } = options;

  try {
    // Type assertion for RPC function not in generated types
    const rpcParams = {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
      content_type_filter: contentType,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }> })
      .rpc('match_embeddings', rpcParams);

    if (error) throw error;

    // Fetch full product details for matched items
    const embeddingMatches = (data as EmbeddingMatch[]) || [];
    if (embeddingMatches.length > 0) {
      const productIds = embeddingMatches
        .filter((item) => item.product_id)
        .map((item) => item.product_id);

      if (productIds.length > 0) {
        const { data: products } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', productIds as number[]);

        // Merge product details with similarity scores
        return embeddingMatches.map((item) => ({
          ...item,
          product: products?.find((p: { id: number }) => p.id === item.product_id),
        }));
      }
    }

    return embeddingMatches;
  } catch (error) {
    console.error('Error searching similar content:', error);
    return [];
  }
}

/**
 * Generate embeddings for all products (batch process)
 */
export async function generateProductEmbeddings(limit: number = 100) {
  try {
    // Get products without embeddings
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(limit);

    if (error) throw error;

    const products = (data as ProductForEmbedding[]) || [];
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const content = generateProductContent(product);
        const embedding = await generateEmbedding(content);
        await storeEmbedding(product.id, content, embedding);
        successCount++;
        console.log(`✅ Generated embedding for product ${product.id}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to generate embedding for product ${product.id}:`, error);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: successCount,
      errors: errorCount,
      total: products.length,
    };
  } catch (error) {
    console.error('Error in batch embedding generation:', error);
    throw error;
  }
}

/**
 * Search FAQs using semantic search
 */
export async function searchFAQs(query: string, limit: number = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search in FAQ embeddings
    const results = await searchSimilarContent(queryEmbedding, {
      matchThreshold: 0.6,
      matchCount: limit,
      contentType: 'faq',
    });

    // Get full FAQ items
    if (results.length > 0) {
      const faqIds = results.map((r: EmbeddingMatch) => r.metadata?.faq_id).filter(Boolean);

      if (faqIds.length > 0) {
        const { data: faqs } = await supabaseAdmin
          .from('faq_items')
          .select('*')
          .in('id', faqIds)
          .eq('is_active', true);

        return faqs || [];
      }
    }

    // Fallback to text search if no semantic matches
    const { data: faqs } = await supabaseAdmin
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(limit);

    return faqs || [];
  } catch (error) {
    console.error('Error searching FAQs:', error);
    return [];
  }
}

/**
 * Generate embeddings for FAQ items
 */
export async function generateFAQEmbeddings() {
  try {
    const { data: faqs, error } = await supabaseAdmin
      .from('faq_items')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    let successCount = 0;

    const faqItems = faqs as FAQItem[] | null;
    for (const faq of faqItems || []) {
      try {
        const content = `${faq.question} ${faq.answer}`;
        const embedding = await generateEmbedding(content);

        // Store embedding with FAQ reference
        const embeddingData: EmbeddingRecord = {
          content,
          content_type: 'faq',
          embedding: JSON.stringify(embedding),
          metadata: {
            faq_id: faq.id,
            category: faq.category,
            model: models.embeddings,
          },
        };

        const { error: storeError } = await (supabaseAdmin
          .from('product_embeddings') as ReturnType<typeof supabaseAdmin.from>)
          .insert(embeddingData as Record<string, unknown>);

        if (!storeError) {
          successCount++;
          console.log(`✅ Generated embedding for FAQ ${faq.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate embedding for FAQ ${faq.id}:`, error);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: successCount,
      total: faqItems?.length || 0,
    };
  } catch (error) {
    console.error('Error generating FAQ embeddings:', error);
    throw error;
  }
}