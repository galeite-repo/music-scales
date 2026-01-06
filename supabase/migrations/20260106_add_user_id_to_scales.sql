-- Adicionar coluna user_id à tabela scales
ALTER TABLE scales ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar índice para melhor performance nas queries
CREATE INDEX idx_scales_user_id ON scales(user_id);

-- Atualizar RLS para user_id
ALTER TABLE scales ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Allow public select scales" ON scales;
DROP POLICY IF EXISTS "Allow public insert scales" ON scales;
DROP POLICY IF EXISTS "Allow public update scales" ON scales;
DROP POLICY IF EXISTS "Allow public delete scales" ON scales;

-- Policy para SELECT: cada usuário vê apenas suas escalas
DROP POLICY IF EXISTS "Users can view their own scales" ON scales;
CREATE POLICY "Users can view their own scales"
  ON scales
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy para INSERT: usuários podem criar escalas
DROP POLICY IF EXISTS "Users can create scales" ON scales;
CREATE POLICY "Users can create scales"
  ON scales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE: usuários podem atualizar suas escalas
DROP POLICY IF EXISTS "Users can update their own scales" ON scales;
CREATE POLICY "Users can update their own scales"
  ON scales
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy para DELETE: usuários podem deletar suas escalas
DROP POLICY IF EXISTS "Users can delete their own scales" ON scales;
CREATE POLICY "Users can delete their own scales"
  ON scales
  FOR DELETE
  USING (auth.uid() = user_id);
