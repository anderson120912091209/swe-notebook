'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const PageEditor = dynamic(() => import('@/app/components/workspace components/PageEditor'), {
  ssr: false,
});

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default function PageEditorPage({ params }: PageProps) {
  const { pageId } = use(params);

  return <PageEditor pageId={pageId} />;
}

