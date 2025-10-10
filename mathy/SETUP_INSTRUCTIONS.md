# Mathy Authentication Setup Instructions

## Step 1: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   - Get these from your Supabase project: Settings > API
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 2: Run SQL Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open `supabase-migration.sql` from the project root
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute the migration
7. You should see "Mathy database schema created successfully!"

## Step 3: Configure OAuth Providers in Supabase

### Google OAuth:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable "Google"
3. Add your Google Client ID and Secret
4. Save changes

### Apple OAuth (Optional):
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable "Apple"
3. Add your Apple credentials
4. Save changes

## Step 4: Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
- Development: `http://localhost:3002`
- Production: `https://yourdomain.com`

**Redirect URLs (add these):**
- `http://localhost:3002/auth/callback`
- `http://localhost:3002/notebook`
- `https://yourdomain.com/auth/callback` (for production)
- `https://yourdomain.com/notebook` (for production)

## Step 5: Test the Authentication

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3002/login`
3. Click "Sign in with Google" or "Sign in with Apple"
4. Complete the OAuth flow
5. You should be redirected to `/notebook`
6. Check Supabase Dashboard > Authentication > Users to see your new user

## Troubleshooting

**"Invalid redirect URL" error:**
- Make sure you added all redirect URLs in Supabase settings
- Check that your Site URL matches your development URL

**OAuth buttons not working:**
- Verify your environment variables are set correctly
- Check that OAuth providers are enabled in Supabase
- Look at browser console for specific error messages

**User created but no profile:**
- Check that the SQL migration ran successfully
- Verify the trigger `on_auth_user_created` exists
- Check Supabase logs for any errors

## What Was Implemented

✅ Supabase client and server configurations
✅ Authentication context with React hooks
✅ Middleware for route protection
✅ OAuth sign-in with Google and Apple
✅ Auth callback handler
✅ Protected route wrapper
✅ User profile creation on signup
✅ Default notebook creation for new users
✅ Database schema with RLS policies

