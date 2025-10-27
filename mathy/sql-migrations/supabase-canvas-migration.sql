-- Mathy Canvas Extension
-- This migration adds canvas support to the existing workspace system
-- Execute this AFTER the main supabase-migration.sql and supabase-folders-migration.sql have been run

-- ============================================================================
-- PART 1: CREATE CANVAS TABLE
-- ============================================================================

-- 1. Create canvas table for tldraw-based canvas objects
CREATE TABLE IF NOT EXISTS public.canvas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Canvas',
  content JSONB DEFAULT '{"shapes": {}, "bindings": {}, "assets": {}}'::jsonb, -- tldraw document format
  icon TEXT, -- emoji or icon identifier (e.g., "🎨", "📊", "🖼️")
  cover_image TEXT, -- optional cover image URL
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL, -- optional folder organization
  "position" INTEGER DEFAULT 0, -- ordering within folder
  is_favorited BOOLEAN DEFAULT false, -- starred/favorite canvases
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable RLS on canvas
ALTER TABLE public.canvas ENABLE ROW LEVEL SECURITY;

-- 3. Canvas RLS policies
DROP POLICY IF EXISTS "Users can view own canvas" ON public.canvas;
CREATE POLICY "Users can view own canvas"
  ON public.canvas FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create canvas" ON public.canvas;
CREATE POLICY "Users can create canvas"
  ON public.canvas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own canvas" ON public.canvas;
CREATE POLICY "Users can update own canvas"
  ON public.canvas FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own canvas" ON public.canvas;
CREATE POLICY "Users can delete own canvas"
  ON public.canvas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART 2: INDEXES FOR PERFORMANCE
-- ============================================================================

-- 4. Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS canvas_user_id_idx ON public.canvas(user_id);
CREATE INDEX IF NOT EXISTS canvas_folder_id_idx ON public.canvas(folder_id);
CREATE INDEX IF NOT EXISTS canvas_position_idx ON public.canvas("position");
CREATE INDEX IF NOT EXISTS canvas_is_favorited_idx ON public.canvas(is_favorited);
CREATE INDEX IF NOT EXISTS canvas_last_edited_at_idx ON public.canvas(last_edited_at DESC);

-- ============================================================================
-- PART 3: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- 5. Add trigger to update last_edited_at when canvas content changes
CREATE OR REPLACE FUNCTION public.handle_canvas_edit()
RETURNS TRIGGER AS $$
BEGIN
  new.last_edited_at = NOW();
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_last_edited_at_canvas ON public.canvas;
CREATE TRIGGER set_last_edited_at_canvas
  BEFORE UPDATE ON public.canvas
  FOR EACH ROW 
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION public.handle_canvas_edit();

-- ============================================================================
-- PART 4: UPDATE WORKSPACE ITEMS FUNCTION
-- ============================================================================

-- 6. Update get_workspace_items function to include canvas
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
    COALESCE(f.last_edited_at, f.updated_at) as last_edited_at
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
  
  UNION ALL
  
  -- Get all root canvas (not in any folder)
  SELECT 
    'canvas'::TEXT as item_type,
    c.id,
    c.title as name,
    c.icon,
    NULL as color,
    c."position",
    c.last_edited_at
  FROM public.canvas c
  WHERE c.user_id = user_uuid
    AND c.folder_id IS NULL
    AND auth.uid() = c.user_id
  
  ORDER BY "position" ASC, last_edited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: UPDATE FOLDER CONTENTS FUNCTION
-- ============================================================================

-- 7. Create function to get all items in a folder (pages + canvas)
CREATE OR REPLACE FUNCTION public.get_folder_contents(folder_uuid UUID)
RETURNS TABLE (
  item_type TEXT,
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
  -- Get all pages in folder
  SELECT 
    'page'::TEXT as item_type,
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
  
  UNION ALL
  
  -- Get all canvas in folder
  SELECT 
    'canvas'::TEXT as item_type,
    c.id,
    c.title,
    c.icon,
    c.cover_image,
    c."position",
    c.last_edited_at,
    c.is_favorited
  FROM public.canvas c
  WHERE c.folder_id = folder_uuid
    AND auth.uid() = c.user_id
  
  ORDER BY "position" ASC, last_edited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

-- 8. Grant permissions for new table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvas TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Mathy canvas extension created successfully! ✅';
  RAISE NOTICE 'Canvas objects can now be created and organized in folders';
  RAISE NOTICE 'Canvas content is stored as tldraw JSON format';
END $$;
