'use client';

import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
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
          {children}
        </ProtectedRoute>
      </ThemeProvider>
    </AuthProvider>
  );
}

