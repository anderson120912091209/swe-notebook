'use client'

import React from 'react';

export default function ProductDemoWindow() {
  return (
    <div className="mt-16 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        
      </div>
      
        {/* Browser Window Component */}
        <div className="bg-neutral-200 rounded-2xl p-2">
          {/* Inner White Content Area - Offset to match reference */}
          <div className="bg-white rounded-2xl ml-1 mt-1">
            {/* Browser Header */}
            <div className="bg-neutral-200 px-4 py-3 flex 
            items-center justify-between">
              {/* Window Controls */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              {/* Browser Actions */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-neutral-300 rounded"></div>
                <div className="w-6 h-6 bg-neutral-300 rounded"></div>
                <div className="w-6 h-6 bg-neutral-300 rounded"></div>
              </div>
            </div>
            
            {/* Browser Content Area */}
            <div className="bg-white p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
