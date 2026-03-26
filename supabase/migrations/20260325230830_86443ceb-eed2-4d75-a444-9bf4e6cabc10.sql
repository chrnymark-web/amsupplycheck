
-- Fix scrape_cache: add admin-only policies (table is only used by edge functions via service role)
-- Only apply if scrape_cache table exists (it may be created in a later migration or via seed)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scrape_cache') THEN
    EXECUTE 'CREATE POLICY "Admins can read scrape_cache" ON public.scrape_cache FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins can insert scrape_cache" ON public.scrape_cache FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins can delete scrape_cache" ON public.scrape_cache FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

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
