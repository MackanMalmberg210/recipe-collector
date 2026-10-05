-- 1. Remove invalid pending reports on private non-quarantined recipes
DELETE FROM public.content_reports
WHERE target_type = 'recipe'
  AND target_id::bigint IN (
    SELECT id FROM public.recipes WHERE is_public = false AND is_quarantined = false
  );

-- 2. Create validation function preventing reports on private recipes or own recipes
CREATE OR REPLACE FUNCTION public.validate_content_report_target()
RETURNS trigger AS $$
DECLARE
  v_is_public boolean;
  v_user_id uuid;
BEGIN
  IF NEW.target_type = 'recipe' THEN
    SELECT is_public, user_id INTO v_is_public, v_user_id
    FROM public.recipes
    WHERE id = NEW.target_id::bigint;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Target recipe does not exist';
    END IF;

    -- Only public recipes can be reported
    IF v_is_public IS NOT TRUE THEN
      RAISE EXCEPTION 'Private recipes cannot be reported';
    END IF;

    -- Users cannot report their own recipes
    IF NEW.reporter_id = v_user_id THEN
      RAISE EXCEPTION 'You cannot report your own recipe';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach before insert trigger
DROP TRIGGER IF EXISTS tr_validate_content_report_target ON public.content_reports;

CREATE TRIGGER tr_validate_content_report_target
BEFORE INSERT ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.validate_content_report_target();
