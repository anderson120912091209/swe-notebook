'use client'

import Link from 'next/link'
import Image from 'next/image';

export default function LoginPage () { 
    return ( 
        
        <div className = "min-h-screen relative overflow-hidden">
            {/* A video background */}
            <div className= "absolute inset-0 w-full h-full">
                <video autoPlay muted loop
                className="w-full h-full object-cover"
                style={{transform: "scale(1.17) translateY(0%)"}}>
                <source src="/videos/sky-wide.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Overlay Content */}
        </div>
    )
}
