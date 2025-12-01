'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import { useAuth } from '@/app/contexts/AuthContext';
import FolderCard from '../Folders/FolderCard';
import PageCard from '../Pages/PageCard';
import WorkspaceLayout from './WorkspaceLayout';
import SearchAndNewButtons from '../SearchAndNewButtons';
import WorkspaceHeaderSwitch, { TabType } from './WorkspaceHeaderSwitch';
import OnboardingModal from '../../onboarding/OnboardingModal';
import { getUserProfile } from '@/app/lib/api/onboarding';
import { onboardingCache } from '@/app/lib/cache/onboardingCache';


export default function WorkspaceView() {
    const { folders, pages, deleteFolder, deletePage, createPage, createFolder, loading } = useWorkspace();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('notebooks');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDescriptionField, setShowDescriptionField] = useState(false);
    const [workspaceDescription, setWorkspaceDescription] = useState('');
    const [creatingPage, setCreatingPage] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingChecked, setOnboardingChecked] = useState(false);

    // Check onboarding status on mount
    useEffect(() => {
        async function checkOnboarding() {
            if (onboardingChecked) return;
            
            try {
                if (user) {
                    // Authenticated user - check Supabase
                    const profile = await getUserProfile(user.id);
                    if (profile && !profile.onboarding_completed) {
                        setShowOnboarding(true);
                    }
                } else {
                    // Guest user - check localStorage
                    const localOnboardingCompleted = onboardingCache.isCompleted();
                    if (!localOnboardingCompleted) {
                        setShowOnboarding(true);
                    }
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // On error, show onboarding for safety (better UX)
                setShowOnboarding(true);
            } finally {
                setOnboardingChecked(true);
            }
        }

        checkOnboarding();
    }, [user, onboardingChecked]);

    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
    };

    // Get root-level folders and pages (memoized)
    const rootFolders = useMemo(() => folders.filter(f => !f.parent_folder_id), [folders]);
    const rootPages = useMemo(() => pages.filter(p => !p.folder_id), [pages]);

    // Get recent pages (10 most recently edited pages across all folders)
    const recentPages = useMemo(() => {
        return [...pages]
            .sort((a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime())
            .slice(0, 10);
    }, [pages]);

    // Get page count for each folder (memoized)
    const getFolderPageCount = useCallback((folderId: string) => {
        return pages.filter(p => p.folder_id === folderId).length;
    }, [pages]);

    // Search filtering logic
    const filteredRootFolders = useMemo(() => {
        if (!searchQuery.trim()) return rootFolders;
        return rootFolders.filter(folder =>
            folder.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rootFolders, searchQuery]);

    const filteredRootPages = useMemo(() => {
        if (!searchQuery.trim()) return rootPages;
        return rootPages.filter(page =>
            page.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rootPages, searchQuery]);


    // Search handler
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);



    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
                    <p>Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (filteredRootFolders.length === 0 && filteredRootPages.length === 0 && !searchQuery) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                        Welcome to your workspace!
                    </h2>
                    <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
                        Get started by creating your first folder or page using the buttons in the sidebar.
                    </p>
                </div>
            </div>
        );
    }


    const headerContent = (
        <>
            {/* Empty - tabs moved to tag position */}
        </>
    );

    const rightHeaderContent = (
        <SearchAndNewButtons
            onNewClick={() => {
                // Default action - create page
                setCreatingPage(true);
            }}
            onNewFolder={() => {
                setCreatingFolder(true);
            }}
            onNewPage={() => {
                setCreatingPage(true);
            }}
            newButtonDisabled={false}
            newButtonLoading={false}
            searchPlaceholder="Search title..."
            onSearchChange={handleSearchChange}
            searchQuery={searchQuery}
        />
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
            <span>Workspace</span>
        </nav>
    );

    return (
        <WorkspaceLayout
            header={headerContent}
            rightHeader={rightHeaderContent}
            breadcrumb={breadcrumb}
            title="Workspace"
            description={workspaceDescription}
            onDescriptionChange={setWorkspaceDescription}
            showDescriptionField={showDescriptionField}
            onToggleDescription={() => setShowDescriptionField(!showDescriptionField)}
            showHamburgerButton={false}
        >
            <div className="max-w-7xl mx-auto p-6">


                {/* Items Section */}
                {activeTab === 'items' && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📚</div>
                        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                            Papers & Materials
                        </h2>
                        <p style={{ color: 'var(--foreground-muted)' }}>
                            Research papers and materials coming soon...
                        </p>
                    </div>
                )}

                {/* Notebooks Section */}
                {activeTab === 'notebooks' && (
                    <div>

                        {/* Folders Section */}
                        {filteredRootFolders.length > 0 && (
                            <section className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                                        Folders {searchQuery && `(${filteredRootFolders.length} found)`}
                                    </h3>
                                </div>

                                <div
                                    className="flex flex-wrap gap-4"
                                    style={{
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {filteredRootFolders.map(folder => (
                                        <FolderCard
                                            key={folder.id}
                                            folder={folder}
                                            pageCount={getFolderPageCount(folder.id)}
                                            onDelete={deleteFolder}
                                            onEdit={() => {/* TODO: Implement edit modal */ }}
                                            isOpen={activeFolderMenuId === folder.id}
                                            onToggle={(open) => setActiveFolderMenuId(open ? folder.id : null)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recent Pages Section */}
                        {recentPages.length > 0 && !searchQuery && (
                            <section className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground-muted)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                                        Recently visited
                                    </h3>
                                </div>
                                <div className="relative">
                                    {/* Left chevron button */}
                                    <button
                                        id="pages-left-chevron"
                                        className="absolute left-2 z-10 rounded-full p-2 transition-opacity duration-200 opacity-0"
                                        style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--foreground-muted)',
                                            top: '40%',
                                            transform: 'translateY(-50%)',
                                        }}
                                        onClick={() => {
                                            const container = document.getElementById('pages-scroll-container');
                                            if (container) {
                                                container.scrollBy({ left: -300, behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {/* Right chevron button */}
                                    <button
                                        id="pages-right-chevron"
                                        className="absolute right-2 z-10 rounded-full p-2 transition-opacity duration-200"
                                        style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--foreground-muted)',
                                            top: '40%',
                                            transform: 'translateY(-50%)',
                                            opacity: 0,
                                        }}
                                        onClick={() => {
                                            const container = document.getElementById('pages-scroll-container');
                                            if (container) {
                                                container.scrollBy({ left: 300, behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <div
                                        id="pages-scroll-container"
                                        className="flex gap-4 overflow-x-auto pb-2"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        ref={(el) => {
                                            if (el) {
                                                // Check initial state on mount
                                                const leftChevron = document.getElementById('pages-left-chevron');
                                                const rightChevron = document.getElementById('pages-right-chevron');

                                                if (leftChevron && rightChevron) {
                                                    const scrollLeft = el.scrollLeft;
                                                    const maxScroll = el.scrollWidth - el.clientWidth;

                                                    // Show chevrons based on scroll position
                                                    leftChevron.style.opacity = scrollLeft > 0 ? '1' : '0';
                                                    rightChevron.style.opacity = maxScroll > 1 ? '1' : '0';
                                                }
                                            }
                                        }}
                                        onScroll={(e) => {
                                            const container = e.currentTarget;
                                            const leftChevron = document.getElementById('pages-left-chevron');
                                            const rightChevron = document.getElementById('pages-right-chevron');

                                            if (leftChevron && rightChevron) {
                                                const scrollLeft = container.scrollLeft;
                                                const maxScroll = container.scrollWidth - container.clientWidth;

                                                // Show left chevron if not at the beginning
                                                leftChevron.style.opacity = scrollLeft > 0 ? '1' : '0';

                                                // Show right chevron if not at the end
                                                rightChevron.style.opacity = scrollLeft < maxScroll - 1 ? '1' : '0';
                                            }
                                        }}
                                    >
                                        {recentPages.map(page => {
                                            const folder = page.folder_id ? folders.find(f => f.id === page.folder_id) : null;
                                            return (
                                                <div key={page.id} className="flex-shrink-0 w-64 h-80">
                                                    <PageCard
                                                        page={page}
                                                        folderName={folder?.name}
                                                        folderColor={folder?.color}
                                                        onDelete={deletePage}
                                                        onEdit={() => {/* TODO: Implement edit modal */ }}
                                                        onMove={() => {/* TODO: Implement move functionality */ }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                )}

                {/* Search Results Empty State */}
                {searchQuery && filteredRootFolders.length === 0 && filteredRootPages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                            No results found
                        </h3>
                        <p style={{ color: 'var(--foreground-muted)' }}>
                            No pages or folders match &ldquo;{searchQuery}&rdquo;
                        </p>
                    </div>
                )}
            </div>

            <OnboardingModal
                isOpen={showOnboarding}
                onClose={handleCloseOnboarding}
            />
        </WorkspaceLayout>
    );
}
