'use client';

import { Analytics } from '@vercel/analytics/next';

export default function AnalyticsWrapper() {
  // Only load Analytics in production and not in Electron builds
  // Check if running in Electron (file:// protocol) or if ELECTRON env var is set
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return null;
  }

  // Analytics component automatically handles production-only loading
  return <Analytics />;
}

