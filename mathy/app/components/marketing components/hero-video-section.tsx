"use client";

export default function HeroVideoSection() {
  return (
    <div className="mt-16 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side - Video Player */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl 
          bg-gradient-to-br from-neutral-200 to-neutral-100 p-1">
            <div className="relative rounded-xl overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-[300px] md:h-[400px] lg:h-[600px] object-cover"
                style={{
                  transform: "scale(1.0) translateY(0%)"
                }}
              >
                <source src="/videos/sky.mp4" type="video/mp4" />
                {/* Fallback gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
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
          {/* Feature Card 1 */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center h-12 w-12 bg-neutral-100 rounded-lg mb-4">
              <div className="w-6 h-6 bg-neutral-400 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Feature One</h3>
            <p className="text-neutral-600 text-sm">
              Placeholder description for your first amazing feature. This will showcase what makes your platform special.
            </p>
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
