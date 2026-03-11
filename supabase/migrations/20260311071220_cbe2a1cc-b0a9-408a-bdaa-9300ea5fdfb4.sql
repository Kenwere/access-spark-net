
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'operator', 'support');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'admin',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Packages
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  duration_label TEXT NOT NULL DEFAULT '2 Hours',
  speed_limit TEXT,
  data_limit TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own packages" ON public.packages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Routers
CREATE TABLE public.routers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL,
  api_port INTEGER NOT NULL DEFAULT 8728,
  username TEXT NOT NULL DEFAULT 'admin',
  password TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'MikroTik',
  status TEXT NOT NULL DEFAULT 'Offline',
  active_users INTEGER NOT NULL DEFAULT 0,
  payment_destination TEXT NOT NULL DEFAULT 'Till',
  disable_sharing BOOLEAN NOT NULL DEFAULT false,
  device_tracking BOOLEAN NOT NULL DEFAULT true,
  bandwidth_control BOOLEAN NOT NULL DEFAULT true,
  session_logging BOOLEAN NOT NULL DEFAULT true,
  dns_name TEXT,
  hotspot_address TEXT DEFAULT '10.5.50.1/24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routers" ON public.routers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  router_id UUID REFERENCES public.routers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  mac_address TEXT,
  device_ip TEXT,
  package_name TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_time TIMESTAMPTZ,
  duration_used INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'M-Pesa',
  router_name TEXT,
  session_expiry TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payments" ON public.payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vouchers
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'Unused',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vouchers" ON public.vouchers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Settings
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT DEFAULT 'HotSpot Pro',
  business_logo_url TEXT,
  support_phone TEXT,
  welcome_message TEXT DEFAULT 'Welcome to fast, reliable WiFi!',
  primary_color TEXT DEFAULT '#2dd4bf',
  background_style TEXT DEFAULT 'dark',
  default_payment_method TEXT DEFAULT 'till',
  till_number TEXT,
  paybill_number TEXT,
  account_number TEXT,
  intasend_pub_key TEXT,
  intasend_secret_key TEXT,
  pesapal_consumer_key TEXT,
  pesapal_consumer_secret TEXT,
  paystack_pub_key TEXT,
  paystack_secret_key TEXT,
  enable_mpesa_till BOOLEAN DEFAULT true,
  enable_mpesa_paybill BOOLEAN DEFAULT false,
  enable_paystack BOOLEAN DEFAULT false,
  enable_intasend BOOLEAN DEFAULT false,
  enable_pesapal BOOLEAN DEFAULT false,
  mac_binding BOOLEAN DEFAULT true,
  auto_disconnect BOOLEAN DEFAULT true,
  allow_session_resume BOOLEAN DEFAULT true,
  enable_https BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
