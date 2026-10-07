-- Allow Trainers to read payment history for applications in their assigned category.
CREATE OR REPLACE FUNCTION public.get_payment_history()
RETURNS TABLE (
  id uuid,
  paid_date date,
  amount numeric,
  application_id text,
  applicant_name text,
  plan_name text,
  paid_by text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.paid_date,
    p.amount,
    a.application_id,
    a.applicant_name,
    pl.name AS plan_name,
    COALESCE(u.name, 'Unknown') AS paid_by
  FROM public.payments p
  INNER JOIN public.applications a ON a.id = p.application_id
  INNER JOIN public.plans pl ON pl.id = p.plan_id
  LEFT JOIN public.users u ON u.id = p.created_by
  WHERE public.can_see_category(a.category)
  ORDER BY p.paid_date DESC, p.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_payment_history() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_payment_history() TO authenticated;
