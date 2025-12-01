-- Add onboarding_completed column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users to have completed onboarding (optional - comment out if you want to show onboarding to all users)
-- UPDATE profiles SET onboarding_completed = TRUE;

-- Add comment to column for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Tracks whether the user has completed the initial onboarding flow';
