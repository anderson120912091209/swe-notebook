"use client";

import { useState } from "react";

export default function WaitlistSmallBtn() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log("Email submitted:", email);
    }
  };

  return (
    <div className={`mt-8 flex rounded-full p-1 inline-flex items-center gap-2 
        transition-all duration-700 ease-in-out ${
      isSubmitted ? 'bg-green-400/80' : 'bg-neutral-200'
    }`}>
      <form onSubmit={handleSubmit} className="contents">
        <div className={`inline-flex items-center gap-1 rounded-full bg-white p-1 transition-all duration-700 ease-in-out ${
          isSubmitted ? 'transform translate-x-40' : ''
        }`}>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent px-6 py-3 text-gray-600 rounded-full 
            placeholder:text-gray-500 font-md outline-none w-64" 
            placeholder={isSubmitted ? "Thank you!" : "Your email address..."}
            required
            disabled={isSubmitted}
          />
          <button 
            type="submit" 
            className="flex items-center justify-center w-10 h-10 
            hover:opacity-70 transition-opacity"
            disabled={isSubmitted}
          >
            {isSubmitted ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(74, 217, 104)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            ) : (
              <svg
               width="24"
               height="24"
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
      <div className={`px-3 text-left tracking-tight text-sm pr-6.5 transition-all duration-700 ${
        isSubmitted ? 'text-white' : 'text-neutral-600'
      }`}>
        {isSubmitted ? (
          <>
            Welcome to the waitlist! <br />
            We'll be in touch soon.
          </>
        ) : (
          <>
            Request an invitation, <br />
            mathy is in limited access.
          </>
        )}
      </div>
    </div>
  );
}
