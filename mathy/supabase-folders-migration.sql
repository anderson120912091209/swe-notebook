-- Mathy Folders & Pages Extension
-- This migration extends the existing notebooks system with folder organization
-- Execute this AFTER the main supabase-migration.sql has been run

-- ============================================================================
-- PART 1: CREATE FOLDERS TABLE
-- ============================================================================

-- 1. Create folders table for organizing notebooks (pages)
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Folder',
  icon TEXT, -- emoji or icon identifier (e.g., "📁", "🚀", "📊")
  color TEXT DEFAULT '#6B7280', -- hex color for folder customization
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE, -- for nested folders
  "position" INTEGER DEFAULT 0, -- for custom ordering in UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 3. Folders RLS policies
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create folders" ON public.folders;
CREATE POLICY "Users can create folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART 2: EXTEND NOTEBOOKS TABLE (PAGES)
-- ============================================================================

-- 4. Add folder organization fields to existing notebooks table
ALTER TABLE public.notebooks 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS icon TEXT, -- page emoji/icon (e.g., "📝", "📊", "🎨")
  ADD COLUMN IF NOT EXISTS cover_image TEXT, -- optional cover image URL
  ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0, -- ordering within folder
  ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN DEFAULT false, -- starred/favorite pages
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- 5. Update the title default to be more page-like
ALTER TABLE public.notebooks 
  ALTER COLUMN title SET DEFAULT 'Untitled Page';

-- ============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================================================

-- 6. Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS folders_parent_folder_id_idx ON public.folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS folders_position_idx ON public.folders("position");

CREATE INDEX IF NOT EXISTS notebooks_folder_id_idx ON public.notebooks(folder_id);
CREATE INDEX IF NOT EXISTS notebooks_position_idx ON public.notebooks("position");
CREATE INDEX IF NOT EXISTS notebooks_is_favorited_idx ON public.notebooks(is_favorited);
CREATE INDEX IF NOT EXISTS notebooks_last_edited_at_idx ON public.notebooks(last_edited_at DESC);

-- ============================================================================
-- PART 4: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- 7. Add trigger for folders updated_at
DROP TRIGGER IF EXISTS set_updated_at_folders ON public.folders;
CREATE TRIGGER set_updated_at_folders
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Add trigger to update last_edited_at when notebook content changes
CREATE OR REPLACE FUNCTION public.handle_notebook_edit()
RETURNS TRIGGER AS $$
BEGIN
  new.last_edited_at = NOW();
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_last_edited_at_notebooks ON public.notebooks;
CREATE TRIGGER set_last_edited_at_notebooks
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW 
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION public.handle_notebook_edit();

-- ============================================================================
-- PART 5: UPDATE NEW USER FUNCTION TO CREATE DEFAULT FOLDER
-- ============================================================================

-- 9. Update handle_new_user function to create a default folder
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_folder_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create a default "Getting Started" folder
  INSERT INTO public.folders (user_id, name, icon, color, "position")
  VALUES (new.id, 'Getting Started', '🚀', '#3B82F6', 0)
  RETURNING id INTO default_folder_id;
  
  -- Create default "Quick Captures" notebook (not in any folder)
  INSERT INTO public.notebooks (user_id, title, is_default, "position")
  VALUES (new.id, 'Quick Captures', true, 0);
  
  -- Create a welcome page in the default folder
  INSERT INTO public.notebooks (
    user_id, 
    title, 
    folder_id, 
    icon,
    "position",
    content
  )
  VALUES (
    new.id, 
    'Welcome to Mathy! 👋', 
    default_folder_id,
    '👋',
    0,
    jsonb_build_object(
      'blocks', 
      jsonb_build_array(
        jsonb_build_object('type', 'heading', 'content', 'Welcome to Mathy!'),
        jsonb_build_object('type', 'paragraph', 'content', 'Start typing your math notes here...')
      )
    )
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- 10. Function to get all notebooks in a folder (ordered by position)
CREATE OR REPLACE FUNCTION public.get_folder_notebooks(folder_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  icon TEXT,
  cover_image TEXT,
  "position" INTEGER,
  last_edited_at TIMESTAMP WITH TIME ZONE,
  is_favorited BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.icon,
    n.cover_image,
    n."position",
    n.last_edited_at,
    n.is_favorited
  FROM public.notebooks n
  WHERE n.folder_id = folder_uuid
    AND auth.uid() = n.user_id
  ORDER BY n."position" ASC, n.last_edited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to get all root-level items (folders + notebooks without folder)
CREATE OR REPLACE FUNCTION public.get_workspace_items(user_uuid UUID)
RETURNS TABLE (
  item_type TEXT,
  id UUID,
  name TEXT,
  icon TEXT,
  color TEXT,
  "position" INTEGER,
  last_edited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  -- Get all root folders
  SELECT 
    'folder'::TEXT as item_type,
    f.id,
    f.name,
    f.icon,
    f.color,
    f."position",
    f.updated_at as last_edited_at
  FROM public.folders f
  WHERE f.user_id = user_uuid
    AND f.parent_folder_id IS NULL
    AND auth.uid() = f.user_id
  
  UNION ALL
  
  -- Get all root notebooks (not in any folder)
  SELECT 
    'page'::TEXT as item_type,
    n.id,
    n.title as name,
    n.icon,
    NULL as color,
    n."position",
    n.last_edited_at
  FROM public.notebooks n
  WHERE n.user_id = user_uuid
    AND n.folder_id IS NULL
    AND auth.uid() = n.user_id
  
  ORDER BY "position" ASC, last_edited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

-- 12. Grant permissions for new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Mathy folders & pages extension created successfully! ✅';
  RAISE NOTICE 'Terminology: folders = folders, notebooks = pages';
  RAISE NOTICE 'New users will get: 1 default folder + 1 quick capture page + 1 welcome page';
END $$;

