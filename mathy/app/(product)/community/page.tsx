'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import WorkspaceLayout from '@/app/components/workspace components/Workspace View/WorkspaceLayout';

interface Community {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    icon: string;
    memberCount: number;
    isJoined?: boolean;
}

// Mock community data
const MOCK_COMMUNITIES: Community[] = [
    {
        id: '1',
        name: 'Claremont McKenna College',
        description: 'The official community for CMC. Find the best study resources',
        coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',
        icon: '🏫',
        memberCount: 2,
    },
    {
        id: '2',
        name: 'Computer Science Students',
        description: 'A place for all CS Students on Opennote to collaborate',
        coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop',
        icon: '💻',
        memberCount: 7,
    },
    {
        id: '3',
        name: 'Data Structures & Algorithms',
        description: 'Learn DSA on Opennote with study groups',
        coverImage: 'https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?w=800&h=450&fit=crop',
        icon: '📊',
        memberCount: 120,
    },
    {
        id: '4',
        name: 'McGill University',
        description: 'The official community for McGill. Connect with fellow students',
        coverImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=450&fit=crop',
        icon: '🎓',
        memberCount: 1,
    },
    {
        id: '5',
        name: 'New Uzbekistan University',
        description: 'The official community for NUU. Share and learn together',
        coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',
        icon: '🏛️',
        memberCount: 2,
    },
];

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCommunities = MOCK_COMMUNITIES.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const breadcrumb = (
        <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <Image
                src="/logos/claritylogo-notext.png"
                alt="Clarity"
                width={15}
                height={15}
                className="opacity-60"
            />
            <span>Communities</span>
        </nav>
    );

    const headerContent = (
        <div className="flex items-center gap-6 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--foreground-muted)' }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-colors focus:border-[#68AAEC]"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--foreground)',
                    }}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('discover')}
                    className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${activeTab === 'discover' ? 'shadow-sm' : 'hover:bg-[var(--hover-bg)]'
                        }`}
                    style={
                        activeTab === 'discover'
                            ? { background: '#68AAEC', color: 'white' }
                            : { color: 'var(--foreground-muted)' }
                    }
                >
                    Discover
                </button>
                <button
                    onClick={() => setActiveTab('joined')}
                    className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${activeTab === 'joined' ? 'shadow-sm' : 'hover:bg-[var(--hover-bg)]'
                        }`}
                    style={
                        activeTab === 'joined'
                            ? { background: '#68AAEC', color: 'white' }
                            : { color: 'var(--foreground-muted)' }
                    }
                >
                    Joined
                </button>
            </div>
        </div>
    );

    return (
        <WorkspaceLayout
            header={headerContent}
            rightHeader={<div />}
            breadcrumb={breadcrumb}
            title="Communities"
            showHamburgerButton={true}
        >
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Informational Banner */}
                    <div
                        className="mb-8 p-6 rounded-xl border-2 transition-all hover:border-[#68AAEC]/30"
                        style={{
                            background: 'var(--card-bg)',
                            borderColor: 'var(--border-color)',
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#68AAEC20' }}>
                                <svg className="w-6 h-6" fill="none" stroke="#68AAEC" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                    What is Community?
                                </h2>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                                    Community is a public learning space where users can join different school or course groups to share science notes and learning resources to learn together.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Communities Grid */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                All communities
                            </h3>
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: '#68AAEC20', color: '#68AAEC' }}
                            >
                                {filteredCommunities.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {/* Create Community Card */}
                            <div
                                className="p-6 rounded-xl border-2 border-dashed cursor-pointer hover:bg-[var(--hover-bg)] hover:border-[#68AAEC]/50 transition-all group flex flex-col justify-between h-[280px]"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <svg
                                    className="w-10 h-10 text-[var(--foreground-muted)] group-hover:text-[#68AAEC] transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <span className="font-semibold text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                    Create community
                                </span>
                            </div>

                            {/* Community Cards */}
                            {filteredCommunities.map((community) => (
                                <div
                                    key={community.id}
                                    className="rounded-xl border hover:shadow-md hover:border-[#68AAEC]/30 transition-all duration-200 cursor-pointer group overflow-hidden"
                                    style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg)' }}
                                >
                                    {/* Cover Image */}
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={community.coverImage}
                                            alt={community.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Icon Overlay */}
                                        <div
                                            className="absolute bottom-3 left-3 w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                                            style={{ background: 'var(--card-bg)', border: '2px solid var(--border-color)' }}
                                        >
                                            {community.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h4 className="font-semibold text-base mb-1.5 truncate" style={{ color: 'var(--foreground)' }}>
                                            {community.name}
                                        </h4>
                                        <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                                            {community.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <span className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                                                    {community.memberCount}
                                                </span>
                                            </div>
                                            <button
                                                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
                                                style={{
                                                    background: '#68AAEC',
                                                    color: 'white',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#5a9de0';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#68AAEC';
                                                }}
                                            >
                                                Join
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </WorkspaceLayout>
    );
}
