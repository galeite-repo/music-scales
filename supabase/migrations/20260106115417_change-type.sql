-- Remove a constraint CHECK atual da coluna type
ALTER TABLE scales
DROP CONSTRAINT IF EXISTS scales_type_check;

-- Garante que a coluna continue NOT NULL
ALTER TABLE scales
ALTER COLUMN type SET NOT NULL;
