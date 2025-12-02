import { createClient } from '@/app/lib/supabase/client';

/**
 * Get user profile including onboarding status
 */
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Mark onboarding as completed for a user
 */
export async function completeOnboarding(userId: string | undefined) {
  if (!userId) {
    // For guest users, we'll handle this in localStorage
    return;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }

  // Return the updated profile to confirm the update
  return data;
}

