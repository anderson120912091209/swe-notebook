'use client'

import React from 'react';
import Image from 'next/image';
import YooptaDemoEditor from './yoopta-demo-editor';

export default function ProductDemoWindow() {
  return (
    <div className="mt-16 lg:mt-0 max-w-5xl mx-auto relative z-10">
      <div className="text-center mb-8">

      </div>

      {/* Browser Window Component - Skiff Minimal Style */}
      <div className="bg-[var(--color-skiff-black)] rounded-xl p-1 shadow-2xl">
        {/* Inner Content Area */}
        <div className="bg-white rounded-lg overflow-hidden border border-[var(--color-skiff-black)]">
          {/* Browser Header - Minimal */}
          <div className="bg-[var(--color-skiff-gray)] px-4 py-3 flex 
            items-center justify-between border-b border-[var(--color-skiff-border)]">
            {/* Window Controls - Monochrome */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[var(--color-skiff-border)] rounded-full"></div>
              <div className="w-3 h-3 bg-[var(--color-skiff-border)] rounded-full"></div>
              <div className="w-3 h-3 bg-[var(--color-skiff-border)] rounded-full"></div>
            </div>

            {/* URL Bar Placeholder */}
            <div className="flex-1 mx-4">
              <div className="h-6 bg-white rounded-md border border-[var(--color-skiff-border)] w-full max-w-md mx-auto opacity-50"></div>
            </div>

            {/* Browser Actions */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[var(--color-skiff-border)] rounded-sm"></div>
            </div>
          </div>

          {/* Browser Content Area */}
          <div className="bg-white p-0 min-h-[460px]">
            <Image
              src="/herodemo.png"
              alt="Mathy Demo"
              width={800}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
