import React from 'react';
import { Folder } from '@/app/types/workspace';

/**
 * Get the full path of folders from root to the specified folder
 * @param folderId - The ID of the target folder
 * @param folders - Array of all folders
 * @returns Array of folders from root to target (including target)
 */
export function getFolderBreadcrumbPath(folderId: string, folders: Folder[]): Folder[] {
  const path: Folder[] = [];
  const folderMap = new Map(folders.map(f => [f.id, f]));
  
  let currentFolder = folderMap.get(folderId);
  
  // Build path by traversing up the hierarchy
  while (currentFolder) {
    path.unshift(currentFolder); // Add to beginning of array
    currentFolder = currentFolder.parent_folder_id ? folderMap.get(currentFolder.parent_folder_id) : null;
  }
  
  return path;
}

/**
 * Generate JSX for folder breadcrumb navigation
 * @param folderPath - Array of folders from root to target
 * @param onFolderClick - Callback when a folder is clicked
 * @param onRootClick - Callback when root/workspace is clicked
 * @returns JSX element for the breadcrumb
 */
export function generateFolderBreadcrumbJSX(
  folderPath: Folder[],
  onFolderClick: (folderId: string) => void,
  onRootClick: () => void
): React.ReactElement {
  return (
    <>
      <button
        onClick={onRootClick}
        className="hover:underline"
      >
        Workspace
      </button>
      {folderPath.map((folder) => (
        <React.Fragment key={folder.id}>
          <span className="mx-2">/</span>
          <button
            onClick={() => onFolderClick(folder.id)}
            className="hover:underline"
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </>
  );
}

