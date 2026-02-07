-- Enable pgvector extension (already enabled)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for products (fixed for UUID product_id)
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL DEFAULT 'product', -- product, faq, document
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product_id ON product_embeddings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_content_type ON product_embeddings(content_type);

-- Create IVFFlat index for vector search (requires data to exist first, so we use HNSW instead)
-- Note: IVFFlat requires training data, HNSW works without it
CREATE INDEX IF NOT EXISTS idx_product_embeddings_embedding ON product_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Create function to search similar embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  content_type_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  content TEXT,
  content_type VARCHAR,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.product_id,
    pe.content,
    pe.content_type,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM product_embeddings pe
  WHERE
    1 - (pe.embedding <=> query_embedding) > match_threshold
    AND (content_type_filter IS NULL OR pe.content_type = content_type_filter)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create FAQ table
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  views INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for FAQ searches
CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_items_tags ON faq_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faq_items_is_active ON faq_items(is_active);

-- Create trigger to update updated_at (function may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop if exist first to avoid errors)
DROP TRIGGER IF EXISTS update_product_embeddings_updated_at ON product_embeddings;
CREATE TRIGGER update_product_embeddings_updated_at BEFORE UPDATE
  ON product_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faq_items_updated_at ON faq_items;
CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE
  ON faq_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
