-- USERS
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  username varchar(30) UNIQUE NOT NULL,
  name varchar(150) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('DEVELOPER','ADMIN','TRAINER')),
  trainer_category varchar(20) NULL CHECK (trainer_category IN ('MALE','FEMALE','COMMON')),
  is_active boolean NOT NULL DEFAULT true,
  join_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT users_role_category CHECK (
    (role IN ('DEVELOPER','ADMIN') AND trainer_category IS NULL) OR
    (role = 'TRAINER' AND trainer_category IS NOT NULL))
);
GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  duration_months integer NOT NULL CHECK (duration_months > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- APPLICATIONS
CREATE SEQUENCE public.application_id_seq START 1;
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id varchar(30) UNIQUE NOT NULL,
  applicant_name varchar(150) NOT NULL,
  age integer CHECK (age IS NULL OR age > 0),
  weight numeric(6,2) CHECK (weight IS NULL OR weight > 0),
  mobile_number varchar(30),
  whatsapp_number varchar(30),
  category varchar(20) NOT NULL CHECK (category IN ('MALE','FEMALE')),
  workout_time varchar(20) CHECK (workout_time IS NULL OR workout_time IN ('DAY','EVENING')),
  application_date date NOT NULL,
  fee_date date NOT NULL,
  last_paid_date date NULL,
  plan_id uuid NULL REFERENCES public.plans(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- CURRENT DUE
CREATE TABLE public.current_due (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  reminder_sent_count integer NOT NULL DEFAULT 0,
  last_reminder_sent_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.current_due TO authenticated;
GRANT ALL ON public.current_due TO service_role;
ALTER TABLE public.current_due ENABLE ROW LEVEL SECURITY;

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  amount numeric(10,2) NOT NULL,
  paid_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_users_upd BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_plans_upd BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_apps_upd BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_due_upd BEFORE UPDATE ON public.current_due FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- HELPERS
CREATE OR REPLACE FUNCTION public.app_user_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND is_active $$;
CREATE OR REPLACE FUNCTION public.is_manager() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active AND role IN ('ADMIN','DEVELOPER')) $$;
CREATE OR REPLACE FUNCTION public.can_see_category(_cat text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_active AND (
    u.role IN ('ADMIN','DEVELOPER') OR u.trainer_category = 'COMMON' OR u.trainer_category = _cat)) $$;
CREATE OR REPLACE FUNCTION public.can_see_application(_app uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.applications a WHERE a.id = _app AND public.can_see_category(a.category)) $$;

-- POLICIES
CREATE POLICY users_self_read ON public.users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_manager());
CREATE POLICY plans_read ON public.plans FOR SELECT TO authenticated USING (public.app_user_role() IS NOT NULL);
CREATE POLICY plans_insert ON public.plans FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY plans_update ON public.plans FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE POLICY apps_read ON public.applications FOR SELECT TO authenticated USING (public.can_see_category(category));
CREATE POLICY due_read ON public.current_due FOR SELECT TO authenticated USING (public.can_see_application(application_id));
CREATE POLICY pay_read ON public.payments FOR SELECT TO authenticated USING (public.can_see_application(application_id));

-- RPCs (all writes on applications / dues / payments go through these)
CREATE OR REPLACE FUNCTION public.create_application(
  _name text, _age int, _weight numeric, _mobile text, _whatsapp text, _category text,
  _workout text, _app_date date, _plan uuid)
RETURNS public.applications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; r public.applications;
BEGIN
  IF NOT public.can_see_category(_category) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan AND is_active;
  IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN'; END IF;
  INSERT INTO public.applications(application_id, applicant_name, age, weight, mobile_number, whatsapp_number,
    category, workout_time, application_date, fee_date, plan_id)
  VALUES ('APP-' || lpad(nextval('public.application_id_seq')::text, 6, '0'), trim(_name), _age, _weight, _mobile, _whatsapp,
    _category, _workout, _app_date, (_app_date + make_interval(months => p.duration_months))::date, p.id)
  RETURNING * INTO r;
  INSERT INTO public.current_due(application_id, due_date) VALUES (r.id, r.fee_date);
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.update_application(
  _id uuid, _name text, _age int, _weight numeric, _mobile text, _whatsapp text, _category text, _workout text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_see_application(_id) OR NOT public.can_see_category(_category) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.applications SET applicant_name = trim(_name), age = _age, weight = _weight, mobile_number = _mobile,
    whatsapp_number = _whatsapp, category = _category, workout_time = _workout WHERE id = _id;
END $$;

CREATE OR REPLACE FUNCTION public.record_payment(_app uuid, _plan uuid, _paid_date date, _amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.applications; p public.plans; new_fee date;
BEGIN
  IF public.app_user_role() IS NULL OR NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  SELECT * INTO a FROM public.applications WHERE id = _app FOR UPDATE;
  IF NOT a.is_active THEN RAISE EXCEPTION 'APPLICATION_INACTIVE'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan AND is_active;
  IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  new_fee := (a.fee_date + make_interval(months => p.duration_months))::date;
  INSERT INTO public.payments(application_id, plan_id, amount, paid_date, created_by) VALUES (_app, _plan, _amount, _paid_date, auth.uid());
  UPDATE public.applications SET last_paid_date = _paid_date, plan_id = _plan, fee_date = new_fee WHERE id = _app;
  DELETE FROM public.current_due WHERE application_id = _app;
  INSERT INTO public.current_due(application_id, due_date) VALUES (_app, new_fee);
  RETURN jsonb_build_object('old_fee_date', a.fee_date, 'new_fee_date', new_fee, 'amount', _amount);
END $$;

CREATE OR REPLACE FUNCTION public.deactivate_application(_app uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.applications SET is_active = false WHERE id = _app;
  DELETE FROM public.current_due WHERE application_id = _app;
END $$;

CREATE OR REPLACE FUNCTION public.reactivate_application(_app uuid, _start date, _plan uuid)
RETURNS date LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; new_fee date;
BEGIN
  IF NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan AND is_active;
  IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN'; END IF;
  new_fee := (_start + make_interval(months => p.duration_months))::date;
  UPDATE public.applications SET is_active = true, fee_date = new_fee, plan_id = _plan WHERE id = _app;
  DELETE FROM public.current_due WHERE application_id = _app;
  INSERT INTO public.current_due(application_id, due_date) VALUES (_app, new_fee);
  RETURN new_fee;
END $$;

CREATE OR REPLACE FUNCTION public.mark_reminder_sent(_app uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  UPDATE public.current_due SET reminder_sent_count = reminder_sent_count + 1, last_reminder_sent_at = now() WHERE application_id = _app;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_application, public.update_application, public.record_payment,
  public.deactivate_application, public.reactivate_application, public.mark_reminder_sent FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_application, public.update_application, public.record_payment,
  public.deactivate_application, public.reactivate_application, public.mark_reminder_sent TO authenticated;
