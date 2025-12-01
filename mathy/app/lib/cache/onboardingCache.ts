/**
 * Onboarding Cache for guest/offline users
 * Stores onboarding completion status locally
 */

const ONBOARDING_KEY = 'workspace_onboarding_completed';

export const onboardingCache = {
    /**
     * Get onboarding completion status from localStorage
     */
    isCompleted(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const value = localStorage.getItem(ONBOARDING_KEY);
            return value === 'true';
        } catch {
            return false;
        }
    },

    /**
     * Mark onboarding as completed in localStorage
     */
    setCompleted(completed: boolean = true): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(ONBOARDING_KEY, completed.toString());
        } catch (error) {
            console.error('Failed to save onboarding status to cache:', error);
        }
    },

    /**
     * Clear onboarding status from localStorage
     */
    clear(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ONBOARDING_KEY);
    },
};

