// Reset COMPLETO del banco de respuestas y palabras.
// Corre esto en Supabase → SQL Editor → New query → Run

-- 1) Borrar TODAS las respuestas y palabras de todos los users
delete from public.responses;
delete from public.words;

-- 2) (Opcional) Borrar también los favoritos para empezar de cero
-- delete from public.favorites;

-- 3) Verificar que quedó vacío
select count(*) as total_responses from public.responses;
select count(*) as total_words from public.words;