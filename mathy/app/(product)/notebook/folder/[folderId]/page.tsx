'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FolderView for code splitting and faster initial load
const FolderView = dynamic(
  () => import('@/app/components/workspace components/Workspace View/FolderView'),
  {
    ssr: false, // Disable SSR for faster client-side navigation
  }
);

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: PageProps) {
  const { folderId } = use(params);
  return <FolderView folderId={folderId} />;
}
