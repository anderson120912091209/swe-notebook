/**
 * Local Storage Cache for offline/guest user operations
 * Stores workspace data locally when user is not authenticated
 */

import type { Folder, Page, Canvas } from '@/app/types/workspace';

const CACHE_KEYS = {
  folders: 'workspace_cache_folders',
  pages: 'workspace_cache_pages',
  canvas: 'workspace_cache_canvas',
  pendingSync: 'workspace_cache_pending_sync',
} as const;

interface PendingSyncItem {
  type: 'create' | 'update' | 'delete';
  entityType: 'folder' | 'page' | 'canvas';
  entityId: string;
  data?: Folder | Page | Canvas;
  timestamp: number;
}

/**
 * Generate a temporary ID for local-only entities
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an ID is a temporary (local-only) ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}

/**
 * Folders Cache
 */
export const foldersCache = {
  get(): Folder[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(CACHE_KEYS.folders);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  set(folders: Folder[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEYS.folders, JSON.stringify(folders));
    } catch (error) {
      console.error('Failed to save folders to cache:', error);
    }
  },

  add(folder: Folder): void {
    const folders = this.get();
    folders.push(folder);
    this.set(folders);
  },

  update(id: string, updates: Partial<Folder>): void {
    const folders = this.get();
    const index = folders.findIndex(f => f.id === id);
    if (index !== -1) {
      folders[index] = { ...folders[index], ...updates };
      this.set(folders);
    }
  },

  remove(id: string): void {
    const folders = this.get();
    this.set(folders.filter(f => f.id !== id));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEYS.folders);
  },
};

/**
 * Pages Cache
 */
export const pagesCache = {
  get(): Page[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(CACHE_KEYS.pages);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  set(pages: Page[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEYS.pages, JSON.stringify(pages));
    } catch (error) {
      console.error('Failed to save pages to cache:', error);
    }
  },

  add(page: Page): void {
    const pages = this.get();
    pages.push(page);
    this.set(pages);
  },

  update(id: string, updates: Partial<Page>): void {
    const pages = this.get();
    const index = pages.findIndex(p => p.id === id);
    if (index !== -1) {
      pages[index] = { ...pages[index], ...updates };
      this.set(pages);
    }
  },

  remove(id: string): void {
    const pages = this.get();
    this.set(pages.filter(p => p.id !== id));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEYS.pages);
  },
};

/**
 * Canvas Cache
 */
export const canvasCache = {
  get(): Canvas[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(CACHE_KEYS.canvas);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  set(canvas: Canvas[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEYS.canvas, JSON.stringify(canvas));
    } catch (error) {
      console.error('Failed to save canvas to cache:', error);
    }
  },

  add(canvas: Canvas): void {
    const canvasList = this.get();
    canvasList.push(canvas);
    this.set(canvasList);
  },

  update(id: string, updates: Partial<Canvas>): void {
    const canvasList = this.get();
    const index = canvasList.findIndex(c => c.id === id);
    if (index !== -1) {
      canvasList[index] = { ...canvasList[index], ...updates };
      this.set(canvasList);
    }
  },

  remove(id: string): void {
    const canvasList = this.get();
    this.set(canvasList.filter(c => c.id !== id));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEYS.canvas);
  },
};

/**
 * Pending Sync Queue
 * Tracks operations that need to be synced to server after login
 */
export const pendingSync = {
  get(): PendingSyncItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(CACHE_KEYS.pendingSync);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  add(item: PendingSyncItem): void {
    const queue = this.get();
    queue.push(item);
    this.set(queue);
  },

  set(queue: PendingSyncItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEYS.pendingSync, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save pending sync queue:', error);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEYS.pendingSync);
  },

  remove(id: string): void {
    const queue = this.get();
    this.set(queue.filter(item => item.entityId !== id));
  },
};

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  foldersCache.clear();
  pagesCache.clear();
  canvasCache.clear();
  pendingSync.clear();
}

