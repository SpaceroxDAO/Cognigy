
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_question_2 text,
  ADD COLUMN IF NOT EXISTS security_answer_hash_2 text;
