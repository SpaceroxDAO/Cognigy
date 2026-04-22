INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

CREATE POLICY "Public read access for assets" ON storage.objects FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Admin insert access for assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));