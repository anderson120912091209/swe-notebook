'use client'

import SignInCard from '../../components/auth components/signin-card';
import FlowingDotsBackground from '../../components/auth components/FlowingDotsBackground';

export default function LoginPage () { 
    return ( 
        <div className="min-h-screen bg-[var(--background)] relative transition-colors duration-200">
            <FlowingDotsBackground />
                <SignInCard />
        </div>
    )
}
