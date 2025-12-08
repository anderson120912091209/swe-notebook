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
import CreatePageModal from '../Pages/CreatePageModal';
import CreateFolderModal from '../Folders/CreateFolderModal';
import { getUserProfile } from '@/app/lib/api/onboarding';
import { onboardingCache } from '@/app/lib/cache/onboardingCache';


export default function WorkspaceView() {
    const { folders, pages, deleteFolder, deletePage, createPage, createFolder, movePageToFolder, loading } = useWorkspace();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('notebooks');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDescriptionField, setShowDescriptionField] = useState(false);
    const [workspaceDescription, setWorkspaceDescription] = useState('');
    const [creatingPage, setCreatingPage] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Check onboarding status on mount and when user changes
    useEffect(() => {
        async function checkOnboarding() {
            try {
                if (user) {
                    // Authenticated user - check Supabase
                    const profile = await getUserProfile(user.id);
                    if (profile && !profile.onboarding_completed) {
                        setShowOnboarding(true);
                    } else {
                        setShowOnboarding(false);
                    }
                } else {
                    // Guest user - check localStorage
                    const localOnboardingCompleted = onboardingCache.isCompleted();
                    if (!localOnboardingCompleted) {
                        setShowOnboarding(true);
                    } else {
                        setShowOnboarding(false);
                    }
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // On error, show onboarding for safety (better UX)
                setShowOnboarding(true);
            }
        }

        checkOnboarding();
    }, [user]);

    const handleCloseOnboarding = async () => {
        setShowOnboarding(false);
        // Re-check onboarding status after closing to ensure it's properly saved
        // This is especially important for authenticated users to verify the database update
        if (user) {
            try {
                const profile = await getUserProfile(user.id);
                if (profile && profile.onboarding_completed) {
                    setShowOnboarding(false);
                } else {
                    // If still not completed, show again (might be a sync issue)
                    console.warn('Onboarding status not updated in database yet');
                }
            } catch (error) {
                console.error('Error re-checking onboarding status:', error);
            }
        }
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

                        {/* Empty State */}
                        {filteredRootFolders.length === 0 && filteredRootPages.length === 0 && !searchQuery && (
                            <div className="flex flex-col items-center justify-center animate-in fade-in duration-500" style={{ minHeight: 'calc(100vh - 400px)' }}>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setCreatingPage(true)}
                                        className="group relative flex flex-col justify-between w-[180px] h-[100px] p-4 rounded-xl transition-all duration-200 hover:scale-[1.0] cursor-pointer"
                                        style={{
                                            backgroundColor: 'rgba(128, 128, 128, 0.08)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)';
                                        }}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#6B8DD6] text-white shadow-sm">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>New Page</span>
                                    </button>

                                    <button
                                        onClick={() => setCreatingFolder(true)}
                                        className="group relative flex flex-col justify-between w-[180px] h-[100px] p-4 rounded-xl transition-all duration-200 hover:scale-[1.0] cursor-pointer"
                                        style={{
                                            backgroundColor: 'rgba(128, 128, 128, 0.08)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)';
                                        }}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#5E9EA0] text-white shadow-sm">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>New Folder</span>
                                    </button>

                                    <button
                                        onClick={() => setShowOnboarding(true)}
                                        className="group relative flex flex-col justify-between w-[180px] h-[100px] p-4 rounded-xl transition-all duration-200 hover:scale-[1.0] cursor-pointer"
                                        style={{
                                            backgroundColor: 'rgba(128, 128, 128, 0.08)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)';
                                        }}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#9B87D6] text-white shadow-sm">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>Tutorials</span>
                                    </button>
                                </div>
                            </div>
                        )}

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
                                                        folders={folders}
                                                        onDelete={deletePage}
                                                        onEdit={() => {/* TODO: Implement edit modal */ }}
                                                        onMove={movePageToFolder}
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

            {/* Modals */}
            {creatingPage && (
                <CreatePageModal
                    onClose={() => setCreatingPage(false)}
                />
            )}

            {creatingFolder && (
                <CreateFolderModal
                    onClose={() => setCreatingFolder(false)}
                />
            )}
        </WorkspaceLayout>
    );
}
