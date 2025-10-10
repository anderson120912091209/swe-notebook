'use client';

import dynamic from 'next/dynamic';

const ScienceEditor = dynamic(() => import('@/app/components/product components/ScienceEditor'), {
  ssr: false,
});

export default function NotebookPage() {
  return (
    <main className="min-h-screen">
      <ScienceEditor />
    </main>
  );
}

