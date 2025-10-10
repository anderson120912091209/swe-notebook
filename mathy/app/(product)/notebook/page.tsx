'use client';

import Sidebar from '@/app/components/workspace components/Sidebar';
import WorkspaceView from '@/app/components/workspace components/WorkspaceView';

export default function NotebookPage() {
  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Sidebar />
      <WorkspaceView />
    </div>
  );
}

