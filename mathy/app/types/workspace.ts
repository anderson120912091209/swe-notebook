// Workspace types for folders and pages (notebooks)

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  parent_folder_id?: string;
  position: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
}

export interface Page {
  id: string;
  user_id: string;
  folder_id?: string;
  title: string;
  content: any; // BlockNote JSON content
  icon?: string;
  cover_image?: string;
  position: number;
  is_default: boolean;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
}

export interface WorkspaceItem {
  item_type: 'folder' | 'page';
  id: string;
  name: string;
  icon?: string;
  color?: string;
  position: number;
  last_edited_at: string;
}

export type ViewMode = 'workspace' | 'folder' | 'editor';

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'workspace' | 'folder' | 'page';
  path: string;
}

// Drag and Drop types
export interface DragItem {
  id: string;
  type: 'folder' | 'page';
  parentId?: string;
  depth: number;
}

export interface DropResult {
  draggedItem: DragItem;
  targetItem: DragItem;
  newParentId?: string;
}
