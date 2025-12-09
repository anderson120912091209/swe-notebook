'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useNamespaceTranslation } from '../../lib/i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import posthog from 'posthog-js';

export default function SignInCard() {
  const { t: tAuth } = useNamespaceTranslation('auth');
  const { signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    posthog.capture('auth_sign_in_attempt', { method: 'google' });
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      const errorMessage = 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
      posthog.capture('auth_sign_in_failure', { 
        method: 'google', 
        error: (err as Error)?.message || errorMessage 
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen w-full font-sans text-[var(--foreground)] relative z-10 transition-colors duration-200">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-8 sm:px-10 mb-8">
        <div className="flex items-center">
          <Image 
            src="/logos/claritylogo-italics.png" 
            alt="Clarity" 
            width={100} 
            height={32} 
            className="h-8 w-auto object-contain"
          />
        </div>
        
        {/* Theme Toggle - iPhone style switch */}
        <button
          onClick={toggleTheme}
          className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 border ${
            theme === 'dark' 
              ? 'bg-[var(--active-bg)] border-[var(--border-color)]' 
              : 'bg-gray-200 border-transparent'
          }`}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label="Toggle theme"
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center ${
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {/* Optional tiny icon inside the toggle circle */}
            {theme === 'dark' ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </div>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-normal tracking-tight" style={{ color: 'var(--foreground)' }}>
              Math & science in the flow.
            </h1>
            <p className="text-lg font-normal" style={{ color: 'var(--foreground-muted)' }}>
              Create your account
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center 
              hover:cursor-pointer 
              justify-between px-4 py-3 
              rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--foreground)'
              }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </div>
            </button>
          </div>

          <p className="text-xs leading-relaxed pt-4" style={{ color: 'var(--muted-text)' }}>
            By continuing, you acknowledge that you understand and agree to the{' '}
            <a href="#" className="underline hover:opacity-80 transition-opacity">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="underline hover:opacity-80 transition-opacity">Privacy Policy</a>.
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="pb-8 flex justify-center">
        <Image 
          src="/logos/claritylogo-notext.png" 
          alt="Clarity" 
          width={40} 
          height={40} 
          className={`opacity-100 grayscale hover:grayscale-0 transition-all duration-500`}
        />
      </footer>
    </div>
  );
}
