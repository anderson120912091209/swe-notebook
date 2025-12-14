// API utilities for workspace operations (folders and pages)

import { createClient } from '@/app/lib/supabase/client';
import type { Folder, Page, WorkspaceItem } from '@/app/types/workspace';

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
      position: 0, // New folders appear first
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
      position: 0, // New pages appear first
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
  // Note: This RPC call may return 400 (Bad Request) if the function is missing or has a signature mismatch.
  // This is expected behavior during development/migration and is handled by the fallback below.

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

