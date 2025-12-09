import { createClient } from '@/app/lib/supabase/client';

export interface UserProfile {
  onboarding_completed: boolean;
  role?: 'student' | 'researcher' | 'professional' | 'other';
  field_of_study?: string;
  university?: string;
  university_domain?: string;
}

export interface OnboardingData {
  role: 'student' | 'researcher' | 'professional' | 'other';
  field_of_study: string;
  university?: string;
  university_domain?: string;
}

/**
 * Get user profile including onboarding status
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed, role, field_of_study, university, university_domain')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Complete onboarding with user information
 */
export async function completeOnboarding(
  userId: string | undefined,
  onboardingData: OnboardingData
) {
  if (!userId) {
    // For guest users, we'll handle this in localStorage
    return;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      role: onboardingData.role,
      field_of_study: onboardingData.field_of_study,
      university: onboardingData.university,
      university_domain: onboardingData.university_domain,
    })
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


