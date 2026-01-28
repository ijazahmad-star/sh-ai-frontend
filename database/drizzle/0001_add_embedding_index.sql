-- Add HNSW index for vector similarity search on documents.embedding
-- This index enables fast approximate nearest neighbor search using cosine distance
-- HNSW (Hierarchical Navigable Small World) is optimal for most use cases
-- Parameters:
--   m = 16: Maximum number of connections per layer (default, good balance)
--   ef_construction = 64: Size of dynamic candidate list for construction (default, good quality)
CREATE INDEX IF NOT EXISTS "documents_embedding_idx" ON "documents" USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);