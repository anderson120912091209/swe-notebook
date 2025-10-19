-- 1. Add item_type column to distinguish between pages and papers
ALTER TABLE public.notebooks 
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'page' CHECK (item_type IN ('page', 'paper'));

-- 2. Add paper-specific columns
ALTER TABLE public.notebooks 
  ADD COLUMN IF NOT EXISTS paper_metadata JSONB, -- DOI, arXiv ID, authors, venue, year, abstract
  ADD COLUMN IF NOT EXISTS paper_source TEXT, -- original source (DOI URL, arXiv URL, or PDF file path)
  ADD COLUMN IF NOT EXISTS paper_status TEXT DEFAULT 'queued' CHECK (paper_status IN ('queued', 'parsing', 'ready', 'error')),
  ADD COLUMN IF NOT EXISTS paper_error_message TEXT, 
  ADD COLUMN IF NOT EXISTS parsed_html_path TEXT, -- HTML output location
  ADD COLUMN IF NOT EXISTS pdf_path TEXT, -- PDF storage path
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT; -- paper preview

-- ============================================================================
-- PART 2: CREATE STORAGE BUCKET
-- ============================================================================

-- 3. Create storage bucket for research papers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'research-papers',
  'research-papers',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/html', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 3: STORAGE POLICIES
-- ============================================================================

-- 4. Enable RLS on storage bucket
-- 5. Create storage policies for research papers
DROP POLICY IF EXISTS "Users can upload their own research papers" ON storage.objects;
CREATE POLICY "Users can upload their own research papers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'research-papers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own research papers" ON storage.objects;
CREATE POLICY "Users can view their own research papers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'research-papers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own research papers" ON storage.objects;
CREATE POLICY "Users can update their own research papers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'research-papers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own research papers" ON storage.objects;
CREATE POLICY "Users can delete their own research papers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'research-papers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- 6. Create indexes for paper-specific queries
CREATE INDEX IF NOT EXISTS notebooks_item_type_idx ON public.notebooks(item_type);
CREATE INDEX IF NOT EXISTS notebooks_paper_status_idx ON public.notebooks(paper_status);
CREATE INDEX IF NOT EXISTS notebooks_paper_metadata_idx ON public.notebooks USING GIN(paper_metadata);

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- 7. Function to get user's research papers
CREATE OR REPLACE FUNCTION get_user_papers(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  folder_id UUID,
  icon TEXT,
  cover_image TEXT,
  "position" INTEGER,
  is_favorited BOOLEAN,
  last_edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  item_type TEXT,
  paper_metadata JSONB,
  paper_source TEXT,
  paper_status TEXT,
  paper_error_message TEXT,
  parsed_html_path TEXT,
  pdf_path TEXT,
  thumbnail_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.content,
    n.folder_id,
    n.icon,
    n.cover_image,
    n.position,
    n.is_favorited,
    n.last_edited_at,
    n.created_at,
    n.updated_at,
    n.item_type,
    n.paper_metadata,
    n.paper_source,
    n.paper_status,
    n.paper_error_message,
    n.parsed_html_path,
    n.pdf_path,
    n.thumbnail_path
  FROM public.notebooks n
  WHERE n.user_id = user_uuid 
    AND n.item_type = 'paper'
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to update paper status
CREATE OR REPLACE FUNCTION update_paper_status(
  paper_id UUID,
  new_status TEXT,
  error_msg TEXT DEFAULT NULL,
  html_path TEXT DEFAULT NULL,
  pdf_path TEXT DEFAULT NULL,
  thumbnail_path TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notebooks 
  SET 
    paper_status = new_status,
    paper_error_message = error_msg,
    parsed_html_path = html_path,
    pdf_path = pdf_path,
    thumbnail_path = thumbnail_path,
    updated_at = NOW()
  WHERE id = paper_id AND item_type = 'paper';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
