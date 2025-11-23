import React from 'react';
import { useNamespaceTranslation } from '../../lib/i18n/LanguageContext';

interface FeatureCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
    <div className="p-8 border-r border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-300 group">
        <div className="mb-6 text-[var(--color-text-primary)] opacity-80">
            {icon || <div className="w-6 h-6 bg-[var(--color-text-primary)] rounded-full"></div>}
        </div>
        <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)] tracking-tight">
            {title}
        </h3>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {description}
        </p>
    </div>
);

export default function FeatureGrid() {
    const { t } = useNamespaceTranslation('marketing');

    // Placeholder data - replace with actual translations or props as needed
    const features = [
        {
            title: "End-to-end Encrypted",
            description: "Your notes are encrypted on your device before they ever reach our servers. Only you hold the keys.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            )
        },
        {
            title: "Open Source",
            description: "Transparency is key to trust. Our client code is open source and available for audit.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
            )
        },
        {
            title: "Offline First",
            description: "Work anywhere, anytime. Your data syncs automatically when you're back online.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
            )
        },
        {
            title: "Markdown Support",
            description: "Write naturally with standard Markdown, plus extended syntax for math and diagrams.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                </svg>
            )
        }
    ];

    return (
        <div className="bg-[var(--color-bg-primary)]">
            <div className="mx-6 md:mx-12 lg:mx-24 max-w-7xl mx-auto py-24">
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] mb-6 tracking-tight">
                        Privacy-first. Powerful features.
                    </h2>
                    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                        Built for those who care about their data and their workflow. No tracking, no ads, just focus.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--color-border-subtle)]">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
