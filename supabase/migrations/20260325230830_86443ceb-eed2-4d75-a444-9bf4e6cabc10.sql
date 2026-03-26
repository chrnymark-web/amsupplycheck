
-- Fix scrape_cache: add admin-only policies (table is only used by edge functions via service role)
CREATE POLICY "Admins can read scrape_cache"
  ON public.scrape_cache FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scrape_cache"
  ON public.scrape_cache FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scrape_cache"
  ON public.scrape_cache FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix user_roles privilege escalation: only admins can modify roles
CREATE POLICY "Only admins can insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
