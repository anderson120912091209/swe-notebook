'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignInCard() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Sign-in Card */}
      <div className="bg-white/80 rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Flower Icon */}
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 mr-3">
            <Link href="/">
            <Image src="/logos/roundedlogo-no-text.png" alt="Mathy Logo" width={32} height={32} />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in </h1>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          By logging in, you agree to our{' '}
          <a href="#" className="text-blue-600 underline decoration-dotted 
          hover:decoration-solid transition-all">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 underline decoration-dotted 
          hover:decoration-solid transition-all">
            Privacy Policy
          </a>
          .
        </p>

        {/* Sign in with Apple Button */}
        <button className="w-full bg-black hover:bg-gray-800 cursor-pointer text-white 
        font-medium py-3 px-2 rounded-full transition-colors duration-200 
        flex items-center justify-center space-x-3">
          {/* Apple Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>Sign in with Apple</span>
        </button>
      </div>
    </div>
  );
}
