-- Habilitar RLS na tabela scales se não estiver habilitado
ALTER TABLE scales ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT (qualquer um pode ler)
DROP POLICY IF EXISTS "Allow public select scales" ON scales;
CREATE POLICY "Allow public select scales"
  ON scales
  FOR SELECT
  USING (true);

-- Policy para INSERT (qualquer um pode criar)
DROP POLICY IF EXISTS "Allow public insert scales" ON scales;
CREATE POLICY "Allow public insert scales"
  ON scales
  FOR INSERT
  WITH CHECK (true);

-- Policy para UPDATE (qualquer um pode atualizar)
DROP POLICY IF EXISTS "Allow public update scales" ON scales;
CREATE POLICY "Allow public update scales"
  ON scales
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy para DELETE (qualquer um pode deletar)
DROP POLICY IF EXISTS "Allow public delete scales" ON scales;
CREATE POLICY "Allow public delete scales"
  ON scales
  FOR DELETE
  USING (true);
