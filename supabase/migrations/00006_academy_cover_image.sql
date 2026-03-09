-- Portada opcional para tutoriales de la academia
ALTER TABLE public.academy_content
  ADD COLUMN IF NOT EXISTS cover_image TEXT;
