REVOKE EXECUTE ON FUNCTION public.app_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_see_category(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_see_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_application(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.deactivate_application(_app uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE id = _app AND is_active) THEN RAISE EXCEPTION 'APPLICATION_INACTIVE'; END IF;
  UPDATE public.applications SET is_active = false WHERE id = _app;
  DELETE FROM public.current_due WHERE application_id = _app;
END $$;

CREATE OR REPLACE FUNCTION public.reactivate_application(_app uuid, _start date, _plan uuid)
RETURNS date LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; new_fee date;
BEGIN
  IF NOT public.can_see_application(_app) THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE id = _app AND is_active) THEN RAISE EXCEPTION 'APPLICATION_ACTIVE'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = _plan AND is_active;
  IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN'; END IF;
  new_fee := (_start + make_interval(months => p.duration_months))::date;
  UPDATE public.applications SET is_active = true, fee_date = new_fee, plan_id = _plan WHERE id = _app;
  DELETE FROM public.current_due WHERE application_id = _app;
  INSERT INTO public.current_due(application_id, due_date) VALUES (_app, new_fee);
  RETURN new_fee;
END $$;

REVOKE EXECUTE ON FUNCTION public.deactivate_application(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reactivate_application(uuid, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_application(uuid, date, uuid) TO authenticated;