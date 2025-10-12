import { use } from 'react';
import FolderView from '@/app/components/workspace components/FolderView';

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: PageProps) {
  const { folderId } = use(params);
  return <FolderView folderId={folderId} />;
}
