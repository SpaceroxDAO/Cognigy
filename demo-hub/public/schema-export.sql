-- ============================================================
-- Database Schema Export — AI Specialist Demos
-- Generated: 2026-03-04
-- ============================================================

-- ======================== ENUMS ========================

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'user',
  'feedback-manager',
  'user-manager',
  'flow-manager'
);

CREATE TYPE public.auth_event_type AS ENUM (
  'login_success',
  'login_failure',
  'logout',
  'password_reset_request',
  'password_reset_complete',
  'security_challenge_success',
  'security_challenge_failure',
  'account_locked'
);

CREATE TYPE public.feedback_status AS ENUM (
  'pending',
  'in-progress',
  'resolved',
  'dismissed'
);

CREATE TYPE public.request_status AS ENUM (
  'pending',
  'approved',
  'declined'
);

CREATE TYPE public.user_type AS ENUM (
  'SE',
  'AE',
  'Partner',
  'Other'
);

-- ======================== TABLES ========================

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  user_type public.user_type NOT NULL DEFAULT 'Other'::user_type,
  force_password_reset boolean NOT NULL DEFAULT false,
  force_security_setup boolean NOT NULL DEFAULT true,
  security_question text,
  security_question_2 text,
  security_answer_hash text,
  security_answer_hash_2 text,
  temp_password_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user'::app_role,
  UNIQUE (user_id, role)
);

CREATE TABLE public.flows (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  path text NOT NULL,
  icon text NOT NULL DEFAULT 'Bot'::text,
  color text NOT NULL DEFAULT 'blue'::text,
  gradient text NOT NULL DEFAULT 'bg-gradient-to-br from-blue-500 to-cyan-500'::text,
  fallback text NOT NULL DEFAULT ''::text,
  avatar text,
  capabilities jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  coming_soon boolean NOT NULL DEFAULT false,
  webrtc_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  user_type public.user_type NOT NULL DEFAULT 'Other'::user_type,
  status public.request_status NOT NULL DEFAULT 'pending'::request_status,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auth_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  event_type public.auth_event_type NOT NULL,
  user_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.demo_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  flow_id text NOT NULL REFERENCES public.flows(id),
  flow_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  flow_id text REFERENCES public.flows(id),
  rating integer,
  message text,
  status public.feedback_status NOT NULL DEFAULT 'pending'::feedback_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.security_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ======================== VIEWS ========================

CREATE VIEW public.profiles_safe WITH (security_invoker = on) AS
  SELECT id, user_id, display_name, avatar_url, user_type,
         force_password_reset, force_security_setup,
         security_question, security_question_2,
         created_at, updated_at
  FROM public.profiles;

-- ======================== FUNCTIONS ========================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_security_attempts()
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.security_attempts
  WHERE last_attempt_at < now() - interval '24 hours';
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- ======================== RLS POLICIES ========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_attempts ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- flows
CREATE POLICY "Authenticated users can view enabled flows" ON public.flows FOR SELECT USING (enabled = true OR coming_soon = true);
CREATE POLICY "Admins can manage flows" ON public.flows FOR ALL USING (has_role(auth.uid(), 'admin'));

-- access_requests
CREATE POLICY "Anyone can create access request" ON public.access_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own access requests" ON public.access_requests FOR SELECT USING (lower(email) = lower(get_current_user_email()));
CREATE POLICY "Admins can view access requests" ON public.access_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update access requests" ON public.access_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "User managers can view access requests" ON public.access_requests FOR SELECT USING (has_role(auth.uid(), 'user-manager'));
CREATE POLICY "User managers can update access requests" ON public.access_requests FOR UPDATE USING (has_role(auth.uid(), 'user-manager'));

-- auth_events
CREATE POLICY "Admins can view all auth events" ON public.auth_events FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "User managers can view auth events" ON public.auth_events FOR SELECT USING (has_role(auth.uid(), 'user-manager'));
CREATE POLICY "Users can insert own auth events" ON public.auth_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can insert auth events" ON public.auth_events FOR INSERT WITH CHECK (user_id IS NULL);

-- demo_logs
CREATE POLICY "Users can view own demo logs" ON public.demo_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own demo logs" ON public.demo_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own demo logs" ON public.demo_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all demo logs" ON public.demo_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- feedback
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all feedback" ON public.feedback FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Feedback managers can manage feedback" ON public.feedback FOR ALL USING (has_role(auth.uid(), 'feedback-manager'));

-- security_attempts
CREATE POLICY "Admins can view security attempts" ON public.security_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));
