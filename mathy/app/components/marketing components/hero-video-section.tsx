"use client";

import { useState, useRef } from "react";
import MathRenderer from "./math-renderer";

export default function HeroVideoSection() {
  //Math Value for Math Renderer 
  const [mathValue, setMathValue] = useState("");
  //Video Ref for Handling Mouse Over and Mouse Leave 
  const videoRef = useRef<HTMLVideoElement>(null);

  //On Hover MP4 Video Play, State Management for Handling Mouse Over and Mouse Leave 
  const handleMathChange = (value: string) => {
    setMathValue(value);
    console.log('Math value:', value);
  };
  const handleVideoHover = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  //Hero Video Section Component
  return (
    <div className="mt-16 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side - Video Player */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl 
          bg-gradient-to-br from-neutral-300 to-neutral-200 p-1">
            <div 
              className="relative rounded-xl overflow-hidden 
              cursor-pointer hover:scale-100 transition-transform duration-300"
              onMouseEnter={handleVideoHover}
              onMouseLeave={handleVideoLeave}
            >
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                className="w-full h-[300px] md:h-[400px] 
                lg:h-[600px] object-cover"
                style={{
                  transform: "scale(1.05) translateY(0%)"
                }}
              >
                <source src="/videos/sky.mp4" type="video/mp4" />
                {/* Fallback gradient */}
                <div className="absolute inset-0 bg-gradient-to-br 
                from-neutral-400 to-neutral-600" />
              </video>
              
              {/* Video overlay */}
              <div className="absolute inset-0 bg-gradient-to-t 
              from-black/20 via-transparent to-transparent" />
              
              {/* Video text overlay */}
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold mb-1">Experience Math Learning</h3>
                <p className="text-white/90 text-sm max-w-xs">
                  Watch our interactive platform in action.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Feature Cards */}
        <div className="space-y-4">
          {/* Feature Card 1 - Math Renderer */}
          <div className="bg-white rounded-xl border-3 border-neutral-200 p-6 
           hover:shadow-sm transition-shadow">
            
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Interactive Math Editor</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Fast, easy and intuitive math editor for teachers and students.
            </p>
            
            {/* Math Renderer Integration */}
            <div className="mt-4">
              <MathRenderer 
                placeholder="Try editing this equation..."
                onChange={handleMathChange}
                className="border-2 border-blue-200"
              />
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center h-12 w-12 bg-neutral-100 rounded-lg mb-4">
              <div className="w-6 h-6 bg-neutral-400 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Feature Two</h3>
            <p className="text-neutral-600 text-sm">
              Placeholder description for your second innovative feature. Highlight the benefits students will experience.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center h-12 w-12 bg-neutral-100 rounded-lg mb-4">
              <div className="w-6 h-6 bg-neutral-400 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Feature Three</h3>
            <p className="text-neutral-600 text-sm">
              Placeholder description for your third powerful feature. Explain how it enhances the learning experience.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
