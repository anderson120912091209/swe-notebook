// Paper storage utilities for uploading and managing PDF files

import { createClient } from '@/app/lib/supabase/client';

const supabase = createClient();

/**
 * Upload a PDF file to Supabase Storage
 * @param file - The PDF file to upload
 * @param userId - The user ID who owns the file
 * @param paperId - Unique identifier for the paper (used as filename)
 * @returns The storage path of the uploaded file
 */
export async function uploadPDF(
  file: File,
  userId: string,
  paperId: string
): Promise<string> {
  const filePath = `${userId}/pdfs/${paperId}.pdf`;

  const { data, error } = await supabase.storage
    .from('research-papers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Failed to upload PDF:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  return filePath;
}

/**
 * Download a PDF file from Supabase Storage
 * @param path - The storage path of the file
 * @returns The file as a Blob
 */
export async function downloadPDF(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('research-papers')
    .download(path);

  if (error) {
    console.error('Failed to download PDF:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from storage');
  }

  return data;
}

/**
 * Delete all files associated with a paper
 * @param paperId - The paper ID
 * @param userId - The user ID who owns the files
 */
export async function deletePaperFiles(
  paperId: string,
  userId: string
): Promise<void> {
  const paths = [
    `${userId}/pdfs/${paperId}.pdf`,
    `${userId}/html/${paperId}.html`,
    `${userId}/thumbnails/${paperId}.png`,
  ];

  const { error } = await supabase.storage
    .from('research-papers')
    .remove(paths);

  if (error) {
    console.error('Failed to delete paper files:', error);
    throw new Error(`Failed to delete paper files: ${error.message}`);
  }
}

