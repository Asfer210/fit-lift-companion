-- Use the Application Number entered in the application form.
CREATE OR REPLACE FUNCTION public.create_application(
  _app_no text, _name text, _age int, _weight numeric, _mobile text, _whatsapp text, _category text,
  _workout text, _app_date date, _plan uuid)
RETURNS public.applications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; r public.applications; v_app_no text;
BEGIN
  IF NOT public.can_see_category(_category) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  v_app_no := upper(trim(_app_no));
  IF v_app_no = '' THEN RAISE EXCEPTION 'APPLICATION_NUMBER_REQUIRED'; END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE application_id = v_app_no) THEN RAISE EXCEPTION 'APPLICATION_NUMBER_EXISTS'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan AND is_active;
  IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN'; END IF;
  INSERT INTO public.applications(application_id, applicant_name, age, weight, mobile_number, whatsapp_number,
    category, workout_time, application_date, fee_date, plan_id)
  VALUES (v_app_no, trim(_name), _age, _weight, _mobile, _whatsapp,
    _category, _workout, _app_date, (_app_date + make_interval(months => p.duration_months))::date, p.id)
  RETURNING * INTO r;
  INSERT INTO public.current_due(application_id, due_date) VALUES (r.id, r.fee_date);
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.update_application(
  _id uuid, _app_no text, _name text, _age int, _weight numeric, _mobile text, _whatsapp text, _category text, _workout text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_app_no text;
BEGIN
  IF NOT public.can_see_application(_id) OR NOT public.can_see_category(_category) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  v_app_no := upper(trim(_app_no));
  IF v_app_no = '' THEN RAISE EXCEPTION 'APPLICATION_NUMBER_REQUIRED'; END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE application_id = v_app_no AND id <> _id) THEN RAISE EXCEPTION 'APPLICATION_NUMBER_EXISTS'; END IF;
  UPDATE public.applications SET application_id = v_app_no, applicant_name = trim(_name), age = _age, weight = _weight,
    mobile_number = _mobile, whatsapp_number = _whatsapp, category = _category, workout_time = _workout WHERE id = _id;
END $$;
