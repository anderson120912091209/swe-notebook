"use client";

import { useState } from "react";

export default function WaitlistSmallBtn() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // LINK THIS SHIT TO BACKEND HEREE*************
      console.log("Email submitted:", email);
    }
  };

  return (
    <div className="mt-8 max-w-full overflow-hidden">
      {/* Mobile Version - Collapsed */}
      <div className={`md:hidden flex rounded-full p-1 items-center transition-all 
      duration-700 ease-in-out ${
        isSubmitted ? 'bg-blue-700/50' : 'bg-neutral-200'
      }`}>
        <form onSubmit={handleSubmit} className="flex items-center w-full">
          <div className={`inline-flex items-center gap-1 rounded-full bg-white p-1 transition-all 
          duration-700 ease-in-out w-full ${
            isSubmitted ? 'transform' : ''
          }`}>
              <input 
                type="email" 
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className={`bg-transparent px-4 py-2 rounded-full 
                placeholder:text-gray-500 font-md outline-none flex-1 w-full text-sm ${
                  isSubmitted ? 'transform ease-in duration-500 text-blue-700/50' : 'text-gray-600'
                }`}
                placeholder={isSubmitted ? "Thank you!" : "Your email address"}
                required
                disabled={isSubmitted}
              />
            <button 
              type="submit" 
              className="flex items-center justify-center w-8 h-8 
              hover:opacity-70 transition-opacity flex-shrink-0"
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgb(29, 78, 216)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              ) : (
                <svg
                 width="16"
                 height="16"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="black"
                 strokeWidth="2"
                 strokeLinecap="round"
                 strokeLinejoin="round"
               >
                 <path d="M5 12h14"></path>
                 <path d="m12 5 7 7-7 7"></path>
               </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Desktop Version - Full with description
      桌面型的 Waitlist Component / 全螢幕時候的會有 Apple Slider Animation */}
      
      <div className={`hidden md:flex rounded-full p-1 items-center gap-1 max-w-lg relative
      transition-all duration-700 ease-in-out ${
        isSubmitted ? 'bg-blue-700/50 inner-shadow-xs' : 'bg-neutral-200'
      }`}>
        {isSubmitted && (
          <span className="text-white text-sm font-sm absolute left-6 top-1/2
           transform -translate-y-1/2 text-center whitespace-nowrap z-0">
             Excited to have you!
          </span>
        )}
        <form onSubmit={handleSubmit} className="w-[80%]">
          <div className={`inline-flex items-center gap-1 rounded-full bg-white p-1 transition-all 
          duration-700 ease-in-out shadow-xs w-full z-10 ${
            isSubmitted ? 'transform  translate-x-43' : ''
          }`}> 
             <input 
               type="email" 
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className={`bg-transparent px-4 py-2 rounded-full 
               placeholder:text-gray-500 font-md outline-none flex-1 text-sm ${
                 isSubmitted ? 'text-blue-700/50' : 'text-gray-600'
               }`}
               placeholder={isSubmitted ? "Thank you!" : "Your email address..."}
               required
               disabled={isSubmitted}
             />
            <button 
              type="submit" 
              className="flex items-center justify-center w-8 h-8 
              hover:opacity-70 transition-opacity flex-shrink-0"
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgb(91, 124, 216)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              ) : (
                <svg
                 width="18"
                 height="18"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="rgb(142, 167, 236)"
                 strokeWidth="2"
                 strokeLinecap="round"
                 strokeLinejoin="round"
               >
                 <path d="M5 12h14"></path>
                 <path d="m12 5 7 7-7 7"></path>
               </svg>
              )}
            </button>
          </div>
        </form>
        <div className={`px-1 text-left tracking-tight text-xs w-[40%]
        transition-all duration-700 ${
          isSubmitted ? 'text-white' : 'text-neutral-600'
        }`}>
          {isSubmitted ? (
            <>
            {/*Placeholder, Empty here*/}
             <br />
            </>
          ) : (
            <>
              Request an invitation, <br />
              mathy is in limited access.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
