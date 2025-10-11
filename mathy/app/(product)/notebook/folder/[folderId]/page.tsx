'use client';

import { use } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Sidebar from '@/app/components/workspace components/Sidebar';
import FolderView from '@/app/components/workspace components/FolderView';

interface PageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: PageProps) {
  const { folderId } = use(params);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <PanelGroup direction="horizontal" className="min-h-screen">
        <Panel 
          defaultSize={20} 
          minSize={15} 
          maxSize={40}
          className="min-h-screen"
        >
          <Sidebar />
        </Panel>
                <PanelResizeHandle 
                  className="bg-transparent transition-colors duration-200" 
                  style={{
                    backgroundColor: 'transparent',
                    width: '1px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                />
        <Panel className="min-h-screen">
          <FolderView folderId={folderId} />
        </Panel>
      </PanelGroup>
    </div>
  );
}

