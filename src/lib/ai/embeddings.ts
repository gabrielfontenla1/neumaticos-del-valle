import { openai, models } from './openai';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
export function generateProductContent(product: any): string {
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
    const { error } = await supabaseAdmin
      .from('product_embeddings')
      .upsert({
        product_id: productId,
        content,
        content_type: contentType,
        embedding: JSON.stringify(embedding),
        metadata: {
          model: models.embeddings,
          generated_at: new Date().toISOString(),
        },
      }, {
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
    const { data, error } = await supabaseAdmin
      .rpc('match_embeddings', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: matchThreshold,
        match_count: matchCount,
        content_type_filter: contentType,
      });

    if (error) throw error;

    // Fetch full product details for matched items
    if (data && data.length > 0) {
      const productIds = data
        .filter((item: any) => item.product_id)
        .map((item: any) => item.product_id);

      if (productIds.length > 0) {
        const { data: products } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', productIds);

        // Merge product details with similarity scores
        return data.map((item: any) => ({
          ...item,
          product: products?.find((p: any) => p.id === item.product_id),
        }));
      }
    }

    return data || [];
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
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(limit);

    if (error) throw error;

    let successCount = 0;
    let errorCount = 0;

    for (const product of products || []) {
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
      total: products?.length || 0,
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
      const faqIds = results.map((r: any) => r.metadata?.faq_id).filter(Boolean);

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

    for (const faq of faqs || []) {
      try {
        const content = `${faq.question} ${faq.answer}`;
        const embedding = await generateEmbedding(content);

        // Store embedding with FAQ reference
        const { error: storeError } = await supabaseAdmin
          .from('product_embeddings')
          .insert({
            content,
            content_type: 'faq',
            embedding: JSON.stringify(embedding),
            metadata: {
              faq_id: faq.id,
              category: faq.category,
              model: models.embeddings,
            },
          });

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
      total: faqs?.length || 0,
    };
  } catch (error) {
    console.error('Error generating FAQ embeddings:', error);
    throw error;
  }
}