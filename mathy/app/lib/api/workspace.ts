// API utilities for workspace operations (folders and pages)

import { createClient } from '@/app/lib/supabase/client';
import type { Folder, Page, Canvas, WorkspaceItem } from '@/app/types/workspace';

const supabase = createClient();

// ============================================================================
// FOLDER OPERATIONS
// ============================================================================

export async function getFolders(userId: string): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFolder(
  userId: string,
  name: string,
  icon?: string,
  color?: string,
  description?: string,
  parentFolderId?: string
): Promise<Folder> {
  // Validate folder name length
  if (name.length > 25) {
    throw new Error('Folder name must be 25 characters or less.');
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: userId,
      name,
      icon: icon || '📁',
      color: color || '#6B7280',
      description,
      parent_folder_id: parentFolderId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Omit<Folder, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_edited_at'>>
): Promise<Folder> {
  // Validate folder name length if name is being updated
  if (updates.name && updates.name.length > 25) {
    throw new Error('Folder name must be 25 characters or less.');
  }

  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

export async function moveFolderToFolder(
  folderId: string,
  parentFolderId: string | null
): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ parent_folder_id: parentFolderId })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// PAGE (NOTEBOOK) OPERATIONS
// ============================================================================

export async function getPages(userId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPagesByFolder(folderId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('folder_id', folderId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPage(pageId: string): Promise<Page> {
  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPage(
  userId: string,
  title: string,
  folderId?: string,
  icon?: string
): Promise<Page> {
  const { data, error } = await supabase
    .from('notebooks')
    .insert({
      user_id: userId,
      title: title || 'Untitled Page',
      folder_id: folderId,
      icon: icon || '📝',
      content: { 
        blocks: [] // Start with empty blocks - BlockNote will create default content
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePage(
  pageId: string,
  updates: Partial<Omit<Page, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Page> {
  const { data, error } = await supabase
    .from('notebooks')
    .update(updates)
    .eq('id', pageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePage(pageId: string): Promise<void> {
  const { error } = await supabase
    .from('notebooks')
    .delete()
    .eq('id', pageId);

  if (error) throw error;
}

export async function movePageToFolder(
  pageId: string,
  folderId: string | null
): Promise<Page> {
  const { data, error } = await supabase
    .from('notebooks')
    .update({ folder_id: folderId })
    .eq('id', pageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// WORKSPACE OPERATIONS
// ============================================================================

export async function getWorkspaceItems(userId: string): Promise<WorkspaceItem[]> {
  const { data, error } = await supabase
    .rpc('get_workspace_items', { user_uuid: userId });

  if (error) {
    // Fallback to manual query if RPC function doesn't exist yet
    const [folders, pages] = await Promise.all([
      getFolders(userId),
      getPages(userId),
    ]);

    const rootFolders = folders
      .filter(f => !f.parent_folder_id)
      .map(f => ({
        item_type: 'folder' as const,
        id: f.id,
        name: f.name,
        icon: f.icon,
        color: f.color,
        position: f.position,
        last_edited_at: f.last_edited_at ?? f.updated_at,
      }));

    const rootPages = pages
      .filter(p => !p.folder_id)
      .map(p => ({
        item_type: 'page' as const,
        id: p.id,
        name: p.title,
        icon: p.icon,
        color: undefined,
        position: p.position,
        last_edited_at: p.last_edited_at,
      }));

    return [...rootFolders, ...rootPages].sort((a, b) => a.position - b.position);
  }

  return data || [];
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeFolders(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel('folders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'folders',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribePages(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel('pages-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notebooks',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// ============================================================================
// CANVAS OPERATIONS
// ============================================================================

export async function getCanvas(userId: string): Promise<Canvas[]> {
  console.log('getCanvas called with userId:', userId);
  
  const { data, error } = await supabase
    .from('canvas')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  console.log('getCanvas result:', { data, error });

  if (error) {
    console.error('getCanvas error details:', error);
    throw error;
  }
  return data || [];
}

export async function createCanvas(
  userId: string,
  title: string,
  icon?: string,
  cover_image?: string,
  folder_id?: string
): Promise<Canvas> {
  // Validate canvas title length
  if (title.length > 100) {
    throw new Error('Canvas title must be 100 characters or less.');
  }

  console.log('createCanvas called with:', { userId, title, icon, cover_image, folder_id });

  const { data, error } = await supabase
    .from('canvas')
    .insert({
      user_id: userId,
      title,
      icon,
      cover_image,
      folder_id,
      content: JSON.stringify({ shapes: {}, bindings: {}, assets: {} }), // Default tldraw document as JSON string
      position: 0,
      is_favorited: false,
    })
    .select()
    .single();

  console.log('createCanvas result:', { data, error });

  if (error) {
    console.error('createCanvas error details:', error);
    throw error;
  }
  return data;
}

export async function updateCanvas(
  canvasId: string,
  updates: Partial<Omit<Canvas, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_edited_at'>>
): Promise<Canvas> {
  // Validate canvas title length if title is being updated
  if (updates.title && updates.title.length > 100) {
    throw new Error('Canvas title must be 100 characters or less.');
  }

  console.log('updateCanvas called with:', { canvasId, updates });

  // Convert content to JSON string if it's an object
  const processedUpdates = { ...updates };
  if (processedUpdates.content && typeof processedUpdates.content === 'object') {
    processedUpdates.content = JSON.stringify(processedUpdates.content);
  }

  const { data, error } = await supabase
    .from('canvas')
    .update(processedUpdates)
    .eq('id', canvasId)
    .select()
    .single();

  console.log('updateCanvas result:', { data, error });

  if (error) {
    console.error('updateCanvas error details:', error);
    throw error;
  }
  return data;
}

export async function deleteCanvas(canvasId: string): Promise<void> {
  const { error } = await supabase
    .from('canvas')
    .delete()
    .eq('id', canvasId);

  if (error) throw error;
}

export async function getCanvasInFolder(folderId: string): Promise<Canvas[]> {
  const { data, error } = await supabase
    .from('canvas')
    .select('*')
    .eq('folder_id', folderId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function subscribeCanvas(
  userId: string,
  callback: () => void
) {
  return supabase
    .channel('canvas-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'canvas',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}
