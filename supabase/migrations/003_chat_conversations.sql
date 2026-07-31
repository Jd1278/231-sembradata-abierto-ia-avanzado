-- SembraData: Conversaciones del chatbot con memoria
-- Ejecutar en Supabase SQL Editor o via `supabase db push`

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session
  ON chat_conversations(session_id, created_at ASC);

COMMENT ON TABLE chat_conversations IS 'Historial de conversaciones del chatbot con memoria por sesión.';

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write chat_conversations"
  ON chat_conversations FOR ALL TO anon USING (true) WITH CHECK (true);
