-- 1. Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recipe-media',
    'recipe-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Recipe Media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access to Recipe Media"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'recipe-media');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload recipe media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Authenticated users can upload recipe media"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'recipe-media');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own recipe media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can update own recipe media"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'recipe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own recipe media' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can delete own recipe media"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'recipe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- 3. Create table public.recipe_cook_photos
CREATE TABLE IF NOT EXISTS public.recipe_cook_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    image_url TEXT NOT NULL,
    storage_path TEXT,
    caption TEXT DEFAULT '',
    rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_cook_photos_recipe_id ON public.recipe_cook_photos(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_cook_photos_user_id ON public.recipe_cook_photos(user_id);

-- Enable RLS
ALTER TABLE public.recipe_cook_photos ENABLE ROW LEVEL SECURITY;

-- Table RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow read cook photos' AND tablename = 'recipe_cook_photos' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow read cook photos" ON public.recipe_cook_photos
            FOR SELECT USING (
                auth.uid() = user_id
                OR recipe_id IN (SELECT id FROM public.recipes WHERE is_public = true)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert cook photos' AND tablename = 'recipe_cook_photos' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow insert cook photos" ON public.recipe_cook_photos
            FOR INSERT WITH CHECK (
                auth.uid() = user_id
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow update cook photos' AND tablename = 'recipe_cook_photos' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow update cook photos" ON public.recipe_cook_photos
            FOR UPDATE USING (
                auth.uid() = user_id
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete cook photos' AND tablename = 'recipe_cook_photos' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Allow delete cook photos" ON public.recipe_cook_photos
            FOR DELETE USING (
                auth.uid() = user_id
            );
    END IF;
END $$;
