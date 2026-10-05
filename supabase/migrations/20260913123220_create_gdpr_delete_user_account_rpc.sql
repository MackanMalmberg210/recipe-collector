CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete user data across all tables
  DELETE FROM public.recipe_cook_photos WHERE user_id = v_user_id;
  DELETE FROM public.user_favorites WHERE user_id = v_user_id;
  DELETE FROM public.grocery_items WHERE user_id = v_user_id;
  DELETE FROM public.pantry_items WHERE user_id = v_user_id;
  DELETE FROM public.meal_plans WHERE user_id = v_user_id;
  DELETE FROM public.content_reports WHERE reporter_id = v_user_id;
  DELETE FROM public.recipes WHERE user_id = v_user_id;
  DELETE FROM public.user_profiles WHERE user_id = v_user_id;

  -- 2. Delete user from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
