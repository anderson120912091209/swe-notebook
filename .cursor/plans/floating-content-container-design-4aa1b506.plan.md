<!-- 4aa1b506-19cb-4185-95c3-d6ee8d2ed1ec 941d11f1-9695-4a71-84ae-7f56ed0c1d45 -->
# Research Paper Feature Implementation

## 1. Database Schema & Types

### Update Supabase Schema

- Extend `notebooks` table to support paper type:
- Add `item_type` ENUM column: `'page' | 'paper'` (default: 'page')
- Add `paper_metadata` JSONB column for: DOI, arXiv ID, authors, venue, year, abstract
- Add `paper_source` TEXT column: original source (DOI URL, arXiv URL, or PDF file path)
- Add `paper_status` ENUM: `'queued' | 'parsing' | 'ready' | 'error'`
- Add `paper_error_message` TEXT column for error states
- Add `parsed_html_path` TEXT column for HTML output location
- Add `pdf_path` TEXT column for PDF storage path
- Add `thumbnail_path` TEXT column for paper preview
- Create new migration file: `supabase-papers-migration.sql`

### Update TypeScript Types

File: `app/types/workspace.ts`

- Extend `Page` interface or create new `Paper` interface with:
- All existing page fields
- `itemType: 'page' | 'paper'`
- `paperMetadata?: { doi?, arxivId?, authors?, venue?, year?, abstract? }`
- `paperSource?: string`
- `paperStatus?: 'queued' | 'parsing' | 'ready' | 'error'`
- `paperErrorMessage?: string`
- `parsedHtmlPath?: string`
- `pdfPath?: string`
- `thumbnailPath?: string`

## 2. Frontend Components

### Component 1: ResearchPaperCard

File: `app/components/workspace components/ResearchPaperCard.tsx`

- Props: `paper` object, `onDelete`, `onOpenModal`, `onReparse`
- Layout: Similar to current WorkspaceView paper cards (lines 267-314)
- Display:
- Status chip (queued=yellow, parsing=blue, ready=green, error=red)
- Title, authors, venue/year badge
- PDF/HTML format badges
- Citations/downloads metrics
- Ellipsis menu (3-dot) with: "Open in new page", "Copy link", "Re-parse", "Delete"
- Click handler: Opens `PaperViewerModal`
- Styling: Match existing `PageCard.tsx` and `FolderCard.tsx` patterns

### Component 2: AddPaperModal

File: `app/components/workspace components/AddPaperModal.tsx`

- Props: `isOpen`, `onClose`, `onSubmit`
- Three input tabs/sections:
- **DOI Input**: Text field with validation (format: 10.xxxx/xxxxx)
- **arXiv Input**: Text field accepting full URL or ID (e.g., 2301.01234 or https://arxiv.org/abs/2301.01234)
- **PDF Upload**: Drag-drop zone using `react-dropzone` or native input
- Submit button triggers:

1. Create paper record with `status='queued'`
2. Upload PDF to Supabase Storage if PDF provided
3. Call `/api/papers/process` endpoint
4. Optimistic UI update
5. Close modal

- Validation: At least one input must be filled

### Component 3: PaperViewerModal

File: `app/components/workspace components/PaperViewerModal.tsx`

- Props: `isOpen`, `onClose`, `paperId`
- Sticky header:
- Paper title, authors list
- Close button (X)
- Action buttons: "Open in new page", "Download PDF"
- Content body (scrollable):
- If `parsedHtmlPath` exists: Render HTML in iframe or div with sanitization
- Else if `pdfPath` exists: Embed PDF using `react-pdf` or `@react-pdf-viewer/core`
- Loading state: Spinner with status text
- Error state: Error message with "Re-parse" button
- Empty state: "No content available"
- Status polling: Poll `/api/papers/[id]/status` every 2-3 seconds if status is 'queued' or 'parsing'

## 3. API Routes

### Route 1: Process Paper (POST)

File: `app/api/papers/process/route.ts`

- Accept: `{ type: 'doi' | 'arxiv' | 'pdf', value: string, paperId: string }`
- Logic:
- If DOI: Call arXiv/Crossref API to resolve metadata → fetch PDF → queue parsing
- If arXiv: Extract ID, call arXiv API → download source/PDF → queue parsing
- If PDF: File already uploaded to Supabase Storage → queue parsing
- Update paper status to 'parsing'
- Add job to in-memory queue (simple array with setTimeout for MVP)
- Return: `{ success: true, paperId }`

### Route 2: Parse Paper (Background Job)

File: `app/api/papers/parse/route.ts` (or internal function)

- Accept: `paperId`
- Logic:

1. Fetch paper record from Supabase
2. Check if source includes LaTeX (arXiv source tarball):

- If yes: Call Docker LaTeXML/Engrafo stub → save HTML
- If no: Mark as `pdfOnly` → generate text preview

3. Generate thumbnail (first page of PDF)
4. Update paper record: `status='ready'`, `parsedHtmlPath`, `thumbnailPath`
5. On error: `status='error'`, `paperErrorMessage`

- Docker stubs:
- Create `docker-compose.yml` with LaTeXML and Engrafo services
- Stub endpoints that return mock HTML for now
- Document how to extend with real parsing

### Route 3: Get Paper Status (GET)

File: `app/api/papers/[id]/status/route.ts`

- Accept: `paperId` from URL params
- Return: `{ status, errorMessage?, parsedHtmlPath?, pdfPath? }`

### Route 4: Delete Paper (DELETE)

File: `app/api/papers/[id]/route.ts`

- Delete paper record from Supabase
- Delete associated files from Supabase Storage (PDF, HTML, thumbnail)

### Route 5: Re-parse Paper (POST)

File: `app/api/papers/[id]/reparse/route.ts`

- Reset status to 'queued'
- Re-trigger parse job

## 4. Storage Setup

### Supabase Storage

- Create bucket: `research-papers`
- Folder structure:
- `/{userId}/pdfs/{paperId}.pdf`
- `/{userId}/html/{paperId}.html`
- `/{userId}/thumbnails/{paperId}.png`
- RLS policies: Users can only access their own files

### Upload Utility

File: `app/lib/api/paperStorage.ts`

- `uploadPDF(file: File, userId: string, paperId: string): Promise<string>`
- `downloadPDF(path: string): Promise<Blob>`
- `deletePaperFiles(paperId: string, userId: string): Promise<void>`

## 5. Context & State Management

### Update WorkspaceContext

File: `app/contexts/WorkspaceContext.tsx`

- Add `papers` state (filtered from `pages` where `itemType='paper'`)
- Add functions:
- `createPaper(metadata, source, type): Promise<Paper>`
- `deletePaper(paperId): Promise<void>`
- `updatePaperStatus(paperId, status, data): Promise<void>`
- `reparsePaper(paperId): Promise<void>`

## 6. Docker Parsing Stubs

### Docker Setup

Files: `docker-compose.yml`, `parsers/latexml.Dockerfile`, `parsers/engrafo.Dockerfile`

- LaTeXML service:
- Endpoint: `POST /parse` accepts `.tex` file
- Returns: HTML string (mock for now: `<html><body>LaTeX content placeholder</body></html>`)
- Engrafo service:
- Endpoint: `POST /convert` accepts `.tar.gz` arxiv source
- Returns: HTML string (mock for now)
- Both services expose port and accept file uploads
- Document in `parsers/README.md` how to extend with real implementations

## 7. Integration into WorkspaceView

### Update WorkspaceView

File: `app/components/workspace components/WorkspaceView.tsx`

- Replace mock `researchPapers` data with real `papers` from context (lines 49-144)
- Update "Add" button click handler (line 249) to open `AddPaperModal`
- Replace inline paper card HTML (lines 267-314) with `<ResearchPaperCard />` component
- Add states: `selectedPaperId`, `isAddModalOpen`, `isViewerModalOpen`

## 8. Testing & Polish

- Empty states for Items tab when no papers exist
- Loading states during API calls
- Error handling with user-friendly messages
- Responsive design for all modals
- Accessibility: keyboard navigation, ARIA labels

## Implementation Order

1. Database schema + migrations
2. TypeScript types
3. Storage setup + utilities
4. ResearchPaperCard component
5. AddPaperModal component
6. API routes (process, status, delete)
7. Docker stubs (basic setup)
8. PaperViewerModal component with polling
9. Integrate into WorkspaceView
10. Context updates
11. Testing & refinement

### To-dos

- [ ] Create database migration and TypeScript types for papers
- [ ] Set up Supabase Storage bucket and upload utilities
- [ ] Build ResearchPaperCard component with status chips and menu
- [ ] Build AddPaperModal with DOI/arXiv/PDF inputs
- [ ] Implement API routes for process, status, delete, reparse
- [ ] Create Docker compose setup with LaTeXML/Engrafo stubs
- [ ] Build PaperViewerModal with HTML/PDF viewer and polling
- [ ] Integrate all components into WorkspaceView Items tab
- [ ] Update WorkspaceContext with paper management functions
- [ ] Add error handling, loading states, and responsive design