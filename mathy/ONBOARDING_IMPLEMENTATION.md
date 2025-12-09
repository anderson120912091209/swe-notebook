# User Onboarding Implementation

## Overview
This document describes the implementation of user onboarding data collection in Clarity, which gathers information about new users during their first sign-in experience.

## Features Implemented

### 1. Database Schema
**File:** `sql-migrations/add_user_onboarding_fields.sql`

Added the following columns to the `profiles` table:
- `role` (TEXT): User's role - student, researcher, professional, or other
- `field_of_study` (TEXT): Primary field of knowledge (e.g., Physics, Mathematics, Biology)
- `university` (TEXT): University name (for students only)
- `university_domain` (TEXT): University email domain from Hipo API (for students only)

**Indexes created:**
- `profiles_university_idx`: For fast university searches
- `profiles_field_of_study_idx`: For analytics and field-based features

### 2. API Layer
**File:** `app/lib/api/onboarding.ts`

Updated with:
- `UserProfile` interface: Extended to include new fields
- `OnboardingData` interface: Type-safe data structure for onboarding submission
- `getUserProfile()`: Returns full profile including new fields
- `completeOnboarding()`: Saves user info and marks onboarding as complete

### 3. UI Component
**File:** `app/components/onboarding/OnboardingModal.tsx`

Enhanced the existing onboarding modal to include a multi-step user info collection flow:

#### User Info Collection Steps (NEW):
1. **Role Selection**: What best describes you?
   - Student
   - Researcher
   - Professional
   - Other

2. **Field of Study**: Free text input
   - Placeholder examples provided
   - Required field

3. **University** (conditional - only for students):
   - Autocomplete search using Hipo University Domain List API
   - Shows university name and country
   - Debounced search (300ms)
   - Stores both name and domain
   - Optional field

#### Feature Tutorial Steps (EXISTING):
After collecting user info, shows the existing feature tutorials:
- Math features
- Search menu
- Math suggestions

### 4. External API Integration
**Hipo University Domain List API:**
- Endpoint: `http://universities.hipolabs.com/search?name={query}`
- Used for university autocomplete
- Returns: name, domain, country
- Limited to 10 results for better UX
- Includes loading states and error handling

## User Flow

```
1. New user signs in with Google
   ↓
2. Redirected to /notebook
   ↓
3. WorkspaceView checks onboarding_completed status
   ↓
4. If false, shows OnboardingModal
   ↓
5. User Info Collection:
   a. Select role
   b. Enter field of study
   c. (If student) Search and select university
   ↓
6. User data saved to profiles table (onboarding_completed still false)
   ↓
7. Feature Tutorials:
   a. Math features
   b. Search menu
   c. Math suggestions
   ↓
8. On completion, set onboarding_completed = true
   ↓
9. User proceeds to app
```

## Design Decisions

### 1. Two-Phase Onboarding
- **Phase 1:** Collect user info (helps personalization)
- **Phase 2:** Show feature tutorials (helps adoption)
- Progressive disclosure: only show university input if role is "student"

### 2. Data Storage Strategy
- User info saved immediately after collection (before tutorials)
- `onboarding_completed` flag set only after all steps complete
- This ensures user data is captured even if they skip tutorials

### 3. UX Considerations
- Autocomplete with debouncing (300ms) for smooth university search
- Visual progress indicator shows total steps
- Back button available on all steps except first
- Skip option available throughout
- Input validation: can't proceed without required fields
- University field is optional (recognizes not all students want to share)

### 4. Analytics
PostHog events captured:
- `onboarding_user_info_collected`: When user completes info collection
- `onboarding_completed`: When full onboarding finished
- `onboarding_skipped`: If user skips, includes step info

## Migration Instructions

### 1. Run SQL Migration
```sql
-- Execute in Supabase SQL Editor
\i sql-migrations/add_user_onboarding_fields.sql
```

### 2. Deploy Changes
No additional deployment steps needed. Changes are backward compatible:
- Existing users: `role`, `field_of_study`, and `university` will be NULL
- New users: Will be prompted during onboarding
- Guest users: LocalStorage handling unchanged

### 3. Optional: Backfill Existing Users
If you want to prompt existing users for this information:
```sql
UPDATE profiles 
SET onboarding_completed = FALSE 
WHERE role IS NULL;
```

## Future Enhancements

1. **Personalization:**
   - Field-specific templates and examples
   - University-specific resources and communities
   - Role-based feature highlights

2. **Analytics:**
   - User demographics dashboard
   - Field distribution analysis
   - University partnerships identification

3. **Additional Fields:**
   - Degree level (undergrad, grad, PhD)
   - Year of study
   - Academic interests/subfields

4. **Validation:**
   - Email domain verification against university domain
   - Institution verification badges

## Technical Notes

- University API calls are debounced to avoid rate limiting
- Component uses React hooks for state management
- Form validation prevents progression without required fields
- Accessible: proper labels, ARIA attributes, keyboard navigation
- Responsive: works on all screen sizes
- Theme-aware: respects light/dark mode
- Smooth animations using Framer Motion

## Testing Checklist

- [ ] New user can complete onboarding flow
- [ ] Student role shows university search
- [ ] Non-student roles skip university step
- [ ] University autocomplete works correctly
- [ ] Data is saved to Supabase correctly
- [ ] Skip button works at any step
- [ ] Back button navigation works
- [ ] Progress indicator updates correctly
- [ ] Onboarding doesn't show again after completion
- [ ] Guest user onboarding still works
- [ ] Feature tutorials show after user info collection
- [ ] Analytics events fire correctly


