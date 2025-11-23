'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const CanvasEditorPage = dynamic(() => import('@/app/components/workspace components/Canvas/CanvasEditorPage'), {
  ssr: false,
});

interface CanvasProps {
  params: Promise<{ canvasId: string }>;
}

export default function CanvasEditorRoute({ params }: CanvasProps) {
  const { canvasId } = use(params);

  return <CanvasEditorPage canvasId={canvasId} />;
}
