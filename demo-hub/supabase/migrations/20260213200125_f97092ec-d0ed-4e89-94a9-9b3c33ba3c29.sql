
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'feedback-manager', 'user-manager', 'flow-manager');

-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('SE', 'AE', 'Partner', 'Other');

-- Create enum for access request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'declined');

-- Create enum for feedback status
CREATE TYPE public.feedback_status AS ENUM ('pending', 'in-progress', 'resolved', 'dismissed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  user_type public.user_type NOT NULL DEFAULT 'Other',
  force_password_reset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Flows table (demo configurations)
CREATE TABLE public.flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  path TEXT NOT NULL UNIQUE,
  webrtc_url TEXT,
  icon TEXT NOT NULL DEFAULT 'Bot',
  color TEXT NOT NULL DEFAULT 'blue',
  gradient TEXT NOT NULL DEFAULT 'bg-gradient-to-br from-blue-500 to-cyan-500',
  avatar TEXT,
  fallback TEXT NOT NULL DEFAULT '',
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  capabilities JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

-- Access requests table
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id TEXT REFERENCES public.flows(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  status public.feedback_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Demo logs table
CREATE TABLE public.demo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id TEXT NOT NULL REFERENCES public.flows(id),
  flow_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.demo_logs ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- Profiles: users can read/update their own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles: users can read own roles, admins can manage all
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Flows: anyone authenticated can read enabled flows, admins can manage
CREATE POLICY "Authenticated users can view enabled flows"
  ON public.flows FOR SELECT
  TO authenticated
  USING (enabled = true OR coming_soon = true);

CREATE POLICY "Admins can manage flows"
  ON public.flows FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow public (anonymous) read of enabled flows for the landing page
CREATE POLICY "Public can view enabled flows"
  ON public.flows FOR SELECT
  TO anon
  USING (enabled = true OR coming_soon = true);

-- Access requests: anyone can insert (no auth needed), admins can manage
CREATE POLICY "Anyone can create access request"
  ON public.access_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can view access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update access requests"
  ON public.access_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Feedback: users can create/view own, admins/feedback-managers can manage all
CREATE POLICY "Users can create own feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
  ON public.feedback FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Feedback managers can manage feedback"
  ON public.feedback FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'feedback-manager'));

-- Demo logs: users can insert own, admins can view all
CREATE POLICY "Users can insert own demo logs"
  ON public.demo_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own demo logs"
  ON public.demo_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all demo logs"
  ON public.demo_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGERS ============

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON public.flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA: Default Flows ============
INSERT INTO public.flows (id, name, description, enabled, path, webrtc_url, icon, color, gradient, avatar, fallback, coming_soon, sort_order) VALUES
('cognicare', 'CogniCare', 'AI-powered healthcare assistant for medical information and patient support', true, '/cognicare', NULL, 'heart', 'red', 'bg-gradient-to-br from-red-500 to-pink-500', '/cognicare-avatar.png', 'I am CogniCare, your AI healthcare assistant. How can I help you today?', false, 1),
('cognifinance', 'CogniFinance', 'Financial services AI specialist for banking and payment assistance', true, '/cognifinance', NULL, 'dollar-sign', 'green', 'bg-gradient-to-br from-green-500 to-emerald-500', '/cognifinance-avatar.png', 'I am CogniFinance, your AI financial assistant. How can I help you with your financial needs?', false, 2),
('cognisupport', 'CogniSupport', 'IT support AI specialist for technical assistance and troubleshooting', true, '/cognisupport', NULL, 'headphones', 'blue', 'bg-gradient-to-br from-blue-500 to-cyan-500', '/cognisupport-avatar.png', 'I am CogniSupport, your AI IT assistant. How can I help you with technical issues?', false, 3),
('cogniinsure', 'CogniInsure', 'Insurance AI specialist for policy management and claims assistance', true, '/cogniinsure', NULL, 'shield', 'purple', 'bg-gradient-to-br from-purple-500 to-indigo-500', '/cogniinsure-avatar.png', 'I am CogniInsure, your AI insurance assistant. How can I help you with your insurance needs?', false, 4),
('cognihome', 'CogniHome', 'AI-powered home services assistant for HVAC, plumbing, and maintenance solutions', true, '/cognihome', 'https://endpoint-trial-us.cognigy.ai/490e24f35f5940ceafb9b444b1b9b5054597cd23da46e9aaff2536fc3b3b7fe1', 'home', 'orange', 'bg-gradient-to-br from-orange-500 to-amber-500', '/cognihome-avatar.png', 'I am CogniHome, your AI home services assistant. How can I help you with HVAC, plumbing, or maintenance needs?', false, 5),
('solaraairlines', 'Solara Airlines', 'AI specialist for airline customer service, bookings, and travel support.', true, '/solaraairlines', 'https://endpoint-trial-us.cognigy.ai/f9a76218acd0532e7d4b91653eaf70cd14c8a46eb7634401fe650bdb791e99d8', 'plane', 'sky', 'bg-gradient-to-br from-sky-500 to-blue-400', '/Solara_Airline-avatar.png', 'I am Solara Airlines, your AI travel assistant. How can I help you with your travel needs?', false, 6);
