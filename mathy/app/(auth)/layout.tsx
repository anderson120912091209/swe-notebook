'use client';

import { AuthProvider } from '@/app/contexts/AuthContext';
import { ThemeProvider } from '@/app/contexts/ThemeContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
    <AuthProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthProvider>
    </ThemeProvider>
  );
}
