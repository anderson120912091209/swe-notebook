'use client'

import Link from "next/link";   
import Image from "next/image";
import WaitlistSmallBtn from "../components/marketing components/waitlist-small-btn";
import ProductDemoWindow from "../components/marketing components/product-demo-window";
import HeroVideoSection from "../components/marketing components/hero-video-section";
import MathRenderer from "../components/marketing components/math-renderer";
import { useNamespaceTranslation } from "../lib/i18n/LanguageContext";
import ClientOnly from "../components/ClientOnly";

export default function LandingPage() {
  const { t: tMarketing } = useNamespaceTranslation('marketing');

  return (
    // Landing Page Background Color Settings and Window 
    <div className="min-h-screen bg-white pt-20">
      {/* Responsive Margin for Content: 
      這個 mx-6 非常重要因為他讓所有的內容全部都有一樣的 responsive margins, 在調整 window 大小
      的時候可以確保我所有的內容的 margin 都是一樣的並且如果 text-left 的話也可以讓我的文字全部靠內容對齊*/}
      <div className="mx-6">
        <div className="relative mx-auto flex justify-center max-w-5xl">
          <div className="w-full">
            {/* Hero Section */}
            <div className="relative z-10 mt-10 pt-12">
              {/* Hero Section Rounded Button for Latest News/Versions/Updates */}
              <div className="text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full 
                  bg-neutral-100 p-1 pr-2.75 border-1 border-neutral-300 
                  text-sm text-neutral-950/60">
                  <span className="flex items-center justify-center">
                    <Image src="/logos/roundedlogo-gray-no-text.png" 
                    alt="mathy Logo" width={20} height={20} />
                  </span>
                  <ClientOnly fallback={<span>Beta version releasing on 2025.9.20</span>}>
                    <span>{tMarketing('betaBadge')}</span>
                  </ClientOnly>
                </div>
              </div>
              {/* Hero Section Slogan */}
              <div className="text-left">
                <ClientOnly fallback={
                  <h1 className="max-w-3xl text-5xl 
                    leading-13 font-semibold tracking-tight text-neutral-900">
                    Learn all levels of math.
                  </h1>
                }>
                  <h1 className="max-w-3xl text-5xl 
                    leading-13 font-semibold tracking-tight text-neutral-900">
                    {tMarketing('heroTitle')}
                  </h1>
                </ClientOnly>
                 <ClientOnly fallback={
                   <h2 className="mt-1 text-2xl font-medium text-neutral-500">
                     with an addictive learning experience.
                   </h2>
                 }>
                   <h2 className="mt-1 text-2xl font-medium text-neutral-500">
                     {tMarketing('heroSubtitle')}
                   </h2>
                 </ClientOnly>
                 
                 {/* Waitlist Button */}
                 <WaitlistSmallBtn />
                 
                 {/* Product Demo Window */}
                 <ProductDemoWindow />
                 
                 {/* Hero Video Section */}
                 <HeroVideoSection />
                 
                 
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  );
}