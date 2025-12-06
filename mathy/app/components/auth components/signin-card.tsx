'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useNamespaceTranslation } from '../../lib/i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import posthog from 'posthog-js';

export default function SignInCard() {
  const { t: tAuth } = useNamespaceTranslation('auth');
  const { signInWithGoogle } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Sign-in Card */}
      <div className="bg-white/50 backdrop-blur-md
      rounded-2xl border-white/40 
      hover:border-gradient-to-r from-white/40 hover:to-white/30
      border-2 shadow-lg p-8 w-full max-w-md">
        {/* Flower Icon */}
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 mr-3">
            <Link href="/">
            <Image src="/logos/roundedlogo-no-text.png" alt="Mathy Logo" width={32} height={32} />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tAuth('signInTitle')}</h1>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-gray-600 text-sm font-md mb-8 leading-relaxed">
          {tAuth('agreeToTerms')}{' '}
          <a href="#" className="text-neutral-600 underline decoration-dotted 
          hover:decoration-solid transition-all">
            {tAuth('termsOfService')}
          </a>{' '}
          {tAuth('and')}{' '}
          <a href="#" className="text-neutral-600 underline decoration-dotted 
          hover:decoration-solid transition-all">
            {tAuth('privacyPolicy')}
          </a>
          .
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Sign in Button */}
        <div className="flex items-center justify-center">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 cursor-pointer text-gray-700 
            font-medium py-3 px-4 rounded-full transition-colors duration-200 
            flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
            {/* Google Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm">{tAuth('signInWithGoogle')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
