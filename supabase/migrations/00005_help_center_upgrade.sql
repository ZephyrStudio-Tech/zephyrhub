-- Help Center upgrade: support_requests + academy_content

-- 1. support_requests: nuevas columnas
ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'abierto',
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. academy_content: nuevas columnas
ALTER TABLE public.academy_content
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS content_body TEXT;

-- 3. RLS: lectura para authenticated (las mutaciones se hacen con createAdminClient en el servidor)
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own support requests" ON public.support_requests;
CREATE POLICY "Users can read own support requests"
  ON public.support_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can read academy content" ON public.academy_content;
CREATE POLICY "Authenticated can read academy content"
  ON public.academy_content
  FOR SELECT
  TO authenticated
  USING (true);
