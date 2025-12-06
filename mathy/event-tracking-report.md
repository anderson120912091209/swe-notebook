# Event tracking report

This document lists all PostHog events that have been automatically added to your Next.js application.

## Events by File

### app/components/auth components/signin-card.tsx

- **auth_sign_in_attempt**: Fired when a user clicks the 'Sign in with Google' button to start the authentication process.
- **auth_sign_in_failure**: Fired when the Google sign-in process fails after a user has attempted to sign in.

### app/components/marketing components/navigationbar.tsx

- **marketing-nav-logo-clicked**: Fired when a user clicks the main logo in the marketing navigation bar.
- **marketing-nav-link-clicked**: Fired when a user clicks a standard link (e.g., Pricing, Guide, Blogs) in the marketing navigation bar.
- **marketing-nav-login-clicked**: Fired when a user clicks the 'Login' button in the marketing navigation bar.

### app/components/marketing components/waitlist-small-btn.tsx

- **waitlist_form_submitted**: Triggered when a user successfully submits their email to the waitlist form.

### app/components/marketing components/yoopta-demo-editor.tsx

- **editor_load_error_refresh_clicked**: Fired when a user clicks the 'Refresh Page' button after the Yoopta demo editor fails to load.

### app/components/onboarding/OnboardingModal.tsx

- **onboarding_completed**: Fired when the user clicks the 'Get Started' button on the final step of the onboarding flow.
- **onboarding_skipped**: Fired when the user clicks the 'Skip' button at any step of the onboarding flow.

### app/components/product components/MathEditor.tsx

- **math_suggestion_used**: Fired when a user selects a suggestion in the math editor.
- **math_expression_saved**: Fired when a user saves a math expression from the editor.

### app/components/product components/ScienceEditor.tsx

- **page-switched**: Fired when the user clicks on a different page in the sidebar navigation.
- **math-equation-saved**: Fired when a user saves a new LaTeX math equation using the math editor.
- **sidebar-toggled**: Fired when the user clicks the button to show or hide the sidebar.

### app/components/workspace components/Folders/CreateFolderModal.tsx

- **folder_created**: Event fired when a user successfully creates a new folder.
- **folder_color_selected**: Event fired when a user selects a color for the new folder.

### app/components/workspace components/Pages/CreatePageModal.tsx

- **page_created**: Fired when a user submits the form to create a new page in the modal.


## Events still awaiting implementation
- (human: you can fill these in)
---

## Next Steps

1. Review the changes made to your files
2. Test that events are being captured correctly
3. Create insights and dashboards in PostHog
4. Make a list of events we missed above. Knock them out yourself, or give this file to an agent.

Learn more about what to measure with PostHog and why: https://posthog.com/docs/new-to-posthog/getting-hogpilled
