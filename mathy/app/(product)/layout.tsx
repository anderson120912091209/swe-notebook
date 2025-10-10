'use client';

import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { WorkspaceProvider } from '@/app/contexts/WorkspaceContext';
import ProtectedRoute from '@/app/components/auth components/ProtectedRoute';

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProtectedRoute>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </ProtectedRoute>
      </ThemeProvider>
    </AuthProvider>
  );
}

