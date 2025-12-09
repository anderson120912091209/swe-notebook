-- Add user onboarding profile fields
-- These fields collect additional user information during onboarding

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('student', 'researcher', 'professional', 'other')),
ADD COLUMN IF NOT EXISTS field_of_study TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS university_domain TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.role IS 'User role: student, researcher, professional, or other';
COMMENT ON COLUMN profiles.field_of_study IS 'Primary field of knowledge/study (e.g., Physics, Mathematics, Biology)';
COMMENT ON COLUMN profiles.university IS 'University name (if user is a student)';
COMMENT ON COLUMN profiles.university_domain IS 'University email domain from Hipo API (if user is a student)';

-- Create index for university searches
CREATE INDEX IF NOT EXISTS profiles_university_idx ON profiles(university);
CREATE INDEX IF NOT EXISTS profiles_field_of_study_idx ON profiles(field_of_study);


