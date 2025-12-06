"use client";

import { useState } from "react";
import { useNamespaceTranslation } from "../../lib/i18n/LanguageContext";
import posthog from 'posthog-js';

export default function WaitlistSmallBtn() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const { t: tMarketing } = useNamespaceTranslation('marketing');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      posthog.capture('waitlist_form_submitted');
      setIsSubmitted(true);
      // LINK THIS SHIT TO BACKEND HEREE*************
      console.log("Email submitted:", email);
    }
  };

  return (
    <div className="mt-8 max-w-full overflow-hidden">
      {/* Mobile Version - Collapsed */}
      <div className={`md:hidden flex rounded-full p-1 items-center transition-all 
      duration-700 ease-in-out border ${isSubmitted ? 'bg-[var(--color-skiff-gray)] border-[var(--color-skiff-border)]' : 'bg-white border-[var(--color-skiff-border)]'
        }`}>
        <form onSubmit={handleSubmit} className="flex items-center w-full">
          <div className={`inline-flex items-center gap-1 rounded-full bg-transparent p-1 transition-all 
          duration-700 ease-in-out w-full ${isSubmitted ? 'transform' : ''
            }`}>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className={`bg-transparent px-4 py-2 rounded-full 
                placeholder:text-[var(--color-skiff-text-muted)] font-md outline-none flex-1 w-full text-sm ${isSubmitted ? 'transform ease-in duration-500 text-[var(--color-skiff-black)]' : 'text-[var(--color-skiff-black)]'
                }`}
              placeholder={isSubmitted ? tMarketing('waitlistThankYou') : tMarketing('waitlistPlaceholder')}
              required
              disabled={isSubmitted}
            />
            <button
              type="submit"
              className={`flex items-center justify-center w-8 h-8 rounded-full
              transition-all flex-shrink-0 ${isSubmitted ? 'bg-green-500' : 'bg-[var(--color-skiff-orange)] hover:opacity-90'
                }`}
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Desktop Version - Full with description */}
      <div className={`hidden md:flex rounded-full p-1 items-center gap-1 max-w-lg relative
      transition-all duration-700 ease-in-out border ${isSubmitted ? 'bg-[var(--color-skiff-black)] border-[var(--color-skiff-black)]' : 'bg-white border-[var(--color-skiff-border)] shadow-sm'
        }`}>
        {isSubmitted && (
          <span className="text-white text-sm font-sm absolute left-6 top-1/2
           transform -translate-y-1/2 text-center whitespace-nowrap z-0">
            {tMarketing('waitlistSuccess')}
          </span>
        )}
        <form onSubmit={handleSubmit} className="w-[65%]">
          <div className={`inline-flex items-center gap-1 rounded-full bg-transparent p-1 transition-all 
          duration-700 ease-in-out w-full z-10 ${isSubmitted ? 'transform translate-x-43 opacity-0' : ''
            }`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`bg-transparent px-4 py-2 rounded-full 
               placeholder:text-[var(--color-skiff-text-muted)] font-md outline-none flex-1 text-sm text-[var(--color-skiff-black)]`}
              placeholder={tMarketing('waitlistPlaceholder')}
              required
              disabled={isSubmitted}
            />
            <button
              type="submit"
              className="flex items-center justify-center w-8 h-8 rounded-full
              bg-[var(--color-skiff-orange)] hover:bg-[#F4511E] transition-colors flex-shrink-0"
              disabled={isSubmitted}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </form>
        <div className={`px-4 text-left tracking-tight text-xs w-[35%] border-l border-[var(--color-skiff-border)] pl-4
        transition-all duration-700 ${isSubmitted ? 'opacity-0' : 'text-[var(--color-skiff-text-muted)]'
          }`}>
          {tMarketing('waitlistRequestInvite')} <br />
          {tMarketing('waitlistLimitedAccess')}
        </div>
      </div>
    </div>
  );
}
