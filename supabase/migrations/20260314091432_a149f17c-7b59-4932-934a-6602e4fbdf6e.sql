
-- Organizations table for multi-tenant ISP support
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My ISP',
  subdomain text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  logo_url text,
  support_email text,
  support_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages org" ON public.organizations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Add provision_token to routers for secure provisioning URL
ALTER TABLE public.routers ADD COLUMN provision_token text DEFAULT encode(gen_random_bytes(32), 'hex');

-- Add org_id to all tenant-scoped tables
ALTER TABLE public.routers ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.packages ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.payments ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.sessions ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.vouchers ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.settings ADD COLUMN org_id uuid REFERENCES public.organizations(id);

-- Update signup trigger to auto-create organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
  subdomain_val text;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');

  -- Generate subdomain from ISP name or email
  subdomain_val := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'isp_name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9]', '-', 'g'
  ));
  -- Trim trailing/leading dashes
  subdomain_val := trim(both '-' from subdomain_val);
  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM public.organizations WHERE subdomain = subdomain_val) THEN
    subdomain_val := subdomain_val || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;

  INSERT INTO public.organizations (name, subdomain, owner_id, support_email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'isp_name', 'My ISP'),
    subdomain_val,
    NEW.id,
    NEW.email
  )
  RETURNING id INTO new_org_id;

  -- Create default settings for the organization
  INSERT INTO public.settings (user_id, org_id, business_name)
  VALUES (NEW.id, new_org_id, COALESCE(NEW.raw_user_meta_data->>'isp_name', 'My ISP'));

  RETURN NEW;
END;
$$;
