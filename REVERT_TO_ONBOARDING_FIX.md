# Instructions: Revert to "onboarding fix" Commit and Deploy

## Current Situation
- **Current commit**: `5921917` - "fix: improve UX and resolve TypeScript errors"
- **Target commit**: `1efa57e` - "onboarding fix"
- **Current branch**: `canvas-feature`
- **Status**: You have uncommitted changes

---

## Step-by-Step Instructions

### STEP 1: Handle Your Uncommitted Changes

You have uncommitted changes that will be lost if you reset. Choose one option:

#### Option A: Save Changes for Later (Recommended)
If you might want these changes later:

```bash
git stash save "WIP: current changes before revert"
```

**What this does:**
- Saves your current changes temporarily
- Resets your working directory to clean state
- You can get them back later with `git stash pop`

#### Option B: Discard Changes Completely
If you don't need these changes:

```bash
git restore .
```

**What this does:**
- Permanently discards all uncommitted changes
- Cannot be undone (unless you have a backup)
- Resets files to last committed version

---

### STEP 2: Reset to the "onboarding fix" Commit

```bash
git reset --hard 1efa57e
```

**What this does:**
- `git reset` - moves your branch pointer to a different commit
- `--hard` - also updates your working directory to match that commit
- `1efa57e` - the commit hash for "onboarding fix"

**Result:**
- Your branch now points to "onboarding fix"
- All commits after it (including "fix: improve UX") are removed from your branch history
- Your files match exactly what they were at "onboarding fix"

---

### STEP 3: Force Push to Remote (Update Your Branch)

⚠️ **WARNING**: Force pushing rewrites history. Make sure your team knows!

```bash
git push --force origin canvas-feature
```

**What this does:**
- `git push` - uploads your local commits to remote (GitHub/GitLab)
- `--force` - overwrites the remote branch with your local version
- `origin` - name of your remote repository
- `canvas-feature` - your branch name

**Why --force is needed:**
- The remote branch has commits you're removing
- Git won't allow normal push (it would lose commits)
- Force push says "I know what I'm doing, overwrite it"

---

### STEP 4: Deploy to Production

The deployment method depends on your hosting platform. Here are common options:

#### If Using Vercel (Most Common for Next.js):

**Option 1: Automatic Deployment**
- Vercel automatically deploys when you push to your main branch
- If `canvas-feature` is connected to production, it will deploy automatically
- Check your Vercel dashboard after pushing

**Option 2: Manual Deployment**
```bash
# If you need to switch to main/master branch first:
git checkout main  # or 'master'
git reset --hard 1efa57e
git push --force origin main

# Then Vercel will auto-deploy
```

**Option 3: Via Vercel Dashboard**
1. Go to vercel.com/dashboard
2. Find your project
3. Click "Deployments"
4. Find the deployment from commit `1efa57e`
5. Click the three dots → "Promote to Production"

#### If Using Other Platforms:

**Netlify:**
- Similar to Vercel - auto-deploys on push
- Or use Netlify dashboard to trigger deploy from specific commit

**Self-hosted / Custom:**
```bash
# SSH into your server, then:
cd /path/to/your/app
git fetch origin
git reset --hard 1efa57e
npm install  # if package.json changed
npm run build
pm2 restart all  # or your restart command
```

---

## Complete Command Sequence (Copy-Paste Ready)

If you want to discard current changes and revert:

```bash
# 1. Discard uncommitted changes
git restore .

# 2. Reset to onboarding fix commit
git reset --hard 1efa57e

# 3. Force push to remote
git push --force origin canvas-feature
```

If you want to save current changes first:

```bash
# 1. Save current changes
git stash save "WIP: before revert to onboarding fix"

# 2. Reset to onboarding fix commit
git reset --hard 1efa57e

# 3. Force push to remote
git push --force origin canvas-feature
```

---

## Important Notes & Warnings

### ⚠️ Before You Proceed:

1. **Backup**: Make sure you have a backup or can recreate any work you might lose
2. **Team Coordination**: If others are working on this branch, coordinate with them
3. **Check Deployment**: Verify which branch is connected to production
4. **Test Locally**: After resetting, test the app locally before deploying

### 📋 What Commits Will Be Lost:

These commits after "onboarding fix" will be removed:
- `5921917` - "fix: improve UX and resolve TypeScript errors"

You can see what you're losing:
```bash
git log 1efa57e..HEAD --oneline
```

### 🔄 If You Need to Undo This Later:

If you realize you made a mistake:

```bash
# Find the commit hash you reset from
git reflog

# Reset back to it (replace COMMIT_HASH with actual hash)
git reset --hard COMMIT_HASH
```

---

## Verification Steps

After reverting, verify everything is correct:

```bash
# 1. Check you're on the right commit
git log --oneline -5
# Should see "1efa57e onboarding fix" at the top

# 2. Check your files match
git status
# Should say "nothing to commit, working tree clean"

# 3. Test locally
npm run dev
# Open browser and test critical features

# 4. Check remote branch
git log origin/canvas-feature --oneline -5
# Should match your local after force push
```

---

## Summary

1. **Handle uncommitted changes** (stash or discard)
2. **Reset to commit `1efa57e`** (the "onboarding fix" commit)
3. **Force push** to update remote branch
4. **Deploy** (automatic if Vercel, or manual via dashboard)

The key concept: You're essentially "rewinding" your git history to an earlier point, removing commits that came after.

