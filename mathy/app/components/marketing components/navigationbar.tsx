'use client';

import Image from "next/image";
import Link from "next/link";
import { useNamespaceTranslation } from "../../lib/i18n/LanguageContext";
import LanguageSwitcher from "../product components/LanguageSwitcher";
import ClientOnly from "../ClientOnly";

/*Navigation Bar Component == DONE
Component used in Layout.tsx of Landing Page (marketing/layout.tsx)*/
export default function NavigationBar() {
  const { t: tNav } = useNamespaceTranslation('navigation');
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md 
    border-gray-200/50" style={{ opacity: 1 }}>
      <div className="mx-6">
        <div className="relative mx-auto flex justify-center max-w-5xl">
          <div className="w-full">
            <div className="relative z-10 flex items-center justify-between pt-3 pb-3">
              {/* Logo Section */}
              <Link 
                href="/" 
                className="hover:text-foreground flex items-center gap-2 
                font-[Alternate] text-xl font-semibold tracking-tight text-neutral-900/80 mix-blend-color"
              >
                <div className="flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="relative h-full w-full">
                      <Image
                        src="/logos/roundedlogo-text-logo.png"
                        alt="Mathy Logo"
                        width={120}
                        height={80}
                        priority
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="flex items-center text-sm font-medium gap-3">
                <ClientOnly fallback={
                  <Link 
                    href="/pricing"
                    className="hover:text-primary 
                    items-center gap-1 rounded-xl p-1.75 px-3 leading-none 
                    transition-colors duration-200 flex font-semibold text-neutral-900/60
                    hover:text-blue-700/70"
                  >
                    Pricing
                  </Link>
                }>
                  <Link 
                    href="/pricing"
                    className="hover:text-primary 
                    items-center gap-1 rounded-xl p-1.75 px-3 leading-none 
                    transition-colors duration-200 flex font-semibold text-neutral-900/60
                    hover:text-blue-700/70"
                  >
                    {tNav('pricing')}
                  </Link>
                </ClientOnly>
                
                <ClientOnly fallback={
                  <Link 
                    href="/guide"
                    className="hover:text-primary 
                    flex items-center gap-1 rounded-xl p-1.75 px-3 leading-none 
                    transition-colors duration-200 font-semibold text-neutral-900/60
                    hover:text-blue-700/70"
                  >
                    Guide
                  </Link>
                }>
                  <Link 
                    href="/guide"
                    className="hover:text-primary 
                    flex items-center gap-1 rounded-xl p-1.75 px-3 leading-none 
                    transition-colors duration-200 font-semibold text-neutral-900/60
                    hover:text-blue-700/70"
                  >
                    {tNav('guide')}
                  </Link>
                </ClientOnly>
                
                <ClientOnly fallback={
                  <Link 
                    href="/login"
                    className="rounded-xl bg-blue-700/60 p-1.25 px-3 
                    text-sm transition-colors hover:bg-blue-700/30 text-white"
                  >
                    Login
                  </Link>
                }>
                  <Link 
                    href="/login"
                    className="rounded-xl bg-blue-700/60 p-1.25 px-3 
                    text-sm transition-colors hover:bg-blue-700/30 text-white"
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
      </div>
    </div>
  );
}