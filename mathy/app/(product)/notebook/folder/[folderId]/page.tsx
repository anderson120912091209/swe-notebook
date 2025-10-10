'use client';

import { use } from 'react';
import Sidebar from '@/app/components/workspace components/Sidebar';
import FolderView from '@/app/components/workspace components/FolderView';

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: PageProps) {
  const { folderId } = use(params);

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Sidebar />
      <FolderView folderId={folderId} />
    </div>
  );
}

