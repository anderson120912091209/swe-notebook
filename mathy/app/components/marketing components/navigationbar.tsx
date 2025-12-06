'use client';

import Image from "next/image";
import Link from "next/link";
import { useNamespaceTranslation } from "../../lib/i18n/LanguageContext";
import LanguageSwitcher from "../product components/LanguageSwitcher";
import ClientOnly from "../ClientOnly";
import posthog from 'posthog-js';

/*Navigation Bar Component == DONE
Component used in Layout.tsx of Landing Page (marketing/layout.tsx)*/
export default function NavigationBar() {
  const { t: tNav } = useNamespaceTranslation('navigation');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/80 backdrop-blur-md 
    border-b border-[var(--color-border-subtle)]" style={{ opacity: 1 }}>
      <div className="mx-6 md:mx-12 lg:mx-24 max-w-7xl mx-auto">
        <div className="relative z-10 flex items-center justify-between pt-4 pb-4">
          {/* Logo Section - Minimalist Black Logo */}
          <Link
            href="/"
            onClick={() => posthog.capture('marketing-nav-logo-clicked', { href: '/' })}
            className="hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <div className="flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="relative h-full w-full">
                  <Image
                    src="/logos/claritylogo-italics.png"
                    alt="Clarity Logo"
                    width={90}
                    height={50}
                    priority
                    className="object-contain grayscale contrast-125"
                  />
                </div>
              </div>
            </div>
          </Link>

          {/* Navigation Links - Simple Text */}
          <div className="flex items-center text-sm font-medium gap-8">
            <ClientOnly fallback={
              <Link
                href="/pricing"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Pricing', href: '/pricing' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                Pricing
              </Link>
            }>
              <Link
                href="/pricing"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Pricing', href: '/pricing' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                {tNav('pricing')}
              </Link>
            </ClientOnly>

            <ClientOnly fallback={
              <Link
                href="/guide"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Guide', href: '/guide' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                Guide
              </Link>
            }>
              <Link
                href="/guide"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Guide', href: '/guide' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                {tNav('guide')}
              </Link>
            </ClientOnly>

            <ClientOnly fallback={
              <Link
                href="/blogs"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Blogs', href: '/blogs' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                Blogs
              </Link>
            }>
              <Link
                href="/blogs"
                onClick={() => posthog.capture('marketing-nav-link-clicked', { link_text: 'Blogs', href: '/blogs' })}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] 
                transition-colors duration-200"
              >
                {tNav('blogs')}
              </Link>
            </ClientOnly>

            <ClientOnly fallback={
              <Link
                href="/login"
                onClick={() => posthog.capture('marketing-nav-login-clicked', { href: '/login' })}
                className="rounded-full bg-[var(--color-text-primary)] px-5 py-2
                text-sm transition-all hover:opacity-80 text-[var(--color-bg-primary)] font-medium"
              >
                Login
              </Link>
            }>
              <Link
                href="/login"
                onClick={() => posthog.capture('marketing-nav-login-clicked', { href: '/login' })}
                className="rounded-full bg-[var(--color-text-primary)] px-5 py-2
                text-sm transition-all hover:opacity-80 text-[var(--color-bg-primary)] font-medium"
              >
                {tNav('login')}
              </Link>
            </ClientOnly>

            {/* Language Switcher */}
            <ClientOnly>
              <LanguageSwitcher />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  );
}
