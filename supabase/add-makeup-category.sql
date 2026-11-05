-- Makeup was removed as a top-level category. This migration is kept as a
-- no-op so older DBs do not reintroduce the category during a schema sync.

notify pgrst, 'reload schema';
