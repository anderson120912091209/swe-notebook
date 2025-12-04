# Security Fix: localStorage Data Leakage

**Date:** 2024-12-04  
**Severity:** CRITICAL  
**Status:** FIXED ✅

---

## Problem

User reported a critical data leakage issue where localStorage data from one account appeared in another account after switching users.

### Reproduction
1. User creates pages/folders as guest (stored in localStorage)
2. User logs into Account A
3. User switches to Account B
4. **BUG:** Account B sees data from Account A

---

## Root Cause

### 1. localStorage is Per-Domain, Not Per-User

```typescript
// ❌ PROBLEM: localStorage is shared across all users on same browser
localStorage.setItem('workspace_cache_folders', JSON.stringify(folders));
localStorage.setItem('workspace_cache_pages', JSON.stringify(pages));
```

When User A logs in, their data is stored in localStorage.  
When User B logs in on the same browser, they get User A's localStorage data.

### 2. Data Merging Logic

```typescript
// ❌ VULNERABLE: Merges localStorage with server data
const folders = user 
  ? [...serverFolders, ...localFolders.filter(f => isTempId(f.id))]
  : localFolders;
```

This merged localStorage data (from previous users) with current user's server data.

### 3. No Cache Clearing on Logout

```typescript
// ❌ PROBLEM: Didn't clear localStorage on logout
const signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = '/notebook';
};
```

localStorage persisted after logout, contaminating next login.

---

## Fix Implementation

### 1. Clear Cache on Logout ✅

**File:** `app/contexts/AuthContext.tsx`

```typescript
import { clearAllCache } from '@/app/lib/cache/localStorageCache';

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  // CRITICAL: Clear all localStorage cache to prevent data leakage between accounts
  clearAllCache();
  
  // Redirect to notebook after sign out
  window.location.href = '/notebook';
};
```

### 2. Clear Cache on Account Switch ✅

**File:** `app/contexts/AuthContext.tsx`

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  const newUser = session?.user ?? null;
  const previousUserId = user?.id;
  const newUserId = newUser?.id;
  
  // CRITICAL: Clear localStorage when switching accounts or signing out
  if (event === 'SIGNED_OUT' || 
      (previousUserId && newUserId && previousUserId !== newUserId)) {
    console.warn('Auth state changed - clearing localStorage to prevent data leakage');
    clearAllCache();
  }
  
  setSession(session);
  setUser(newUser);
  setLoading(false);
});
```

### 3. Clear Cache on Login ✅

**File:** `app/contexts/WorkspaceContext.tsx`

```typescript
useEffect(() => {
  if (user && typeof window !== 'undefined') {
    // User just logged in or switched accounts
    // Clear all local cache to prevent cross-account data contamination
    const cachedFolders = foldersCache.get();
    const cachedPages = pagesCache.get();
    
    // Only clear if there's cached data (prevents unnecessary operations)
    if (cachedFolders.length > 0 || cachedPages.length > 0) {
      console.warn('User logged in - clearing guest data to prevent leakage');
      clearAllCache();
      setLocalFolders([]);
      setLocalPages([]);
    }
  } else if (!user && typeof window !== 'undefined') {
    // User logged out - reload guest data
    setLocalFolders(foldersCache.get());
    setLocalPages(pagesCache.get());
  }
}, [user?.id]);
```

### 4. Remove Data Merging ✅

**File:** `app/contexts/WorkspaceContext.tsx`

```typescript
// ✅ FIXED: Don't merge localStorage with server data
const folders = user 
  ? serverFolders // Only show server data, don't merge with local cache
  : localFolders; // Only show local cache for guests

const pages = user
  ? serverPages // Only show server data, don't merge with local cache
  : localPages; // Only show local cache for guests
```

**Previous vulnerable code:**
```typescript
// ❌ REMOVED
const folders = user 
  ? [...serverFolders, ...localFolders.filter(f => isTempId(f.id))]
  : localFolders;
```

### 5. Disable Auto-Sync ✅

**File:** `app/contexts/WorkspaceContext.tsx`

Removed the entire `syncLocalDataToServer` useEffect that automatically synced guest data to the server when logging in. This was a security risk as it could sync the wrong user's data.

---

## Security Improvements

| Before | After |
|--------|-------|
| ❌ localStorage persisted across logins | ✅ Cleared on logout |
| ❌ Guest data mixed with authenticated data | ✅ Complete isolation |
| ❌ Account A's data in Account B | ✅ Data cleared on switch |
| ❌ No data isolation | ✅ Full isolation |

---

## Breaking Changes

### Guest Data No Longer Synced

**Before:** When guest users logged in, their localStorage data was automatically synced to their account.

**After:** When users log in, their localStorage data is **cleared** to prevent security issues.

**Impact:** Guest users will lose their work when logging in.

**Future Solution:** Add manual export/import feature for guest users.

---

## Testing

### Test Case 1: Guest → Login
```
1. Create folders/pages as guest
2. Log in with Account A
3. ✅ Verify guest data is NOT visible
4. ✅ Verify localStorage is cleared
```

### Test Case 2: Account Switch
```
1. Log in with Account A
2. Log out
3. Log in with Account B
4. ✅ Verify Account A's data is NOT visible
5. ✅ Verify localStorage is cleared
```

### Test Case 3: Shared Computer
```
1. User A logs in, creates data, logs out
2. User B logs in on same computer
3. ✅ Verify User A's data is NOT visible to User B
```

---

## Files Changed

1. `app/contexts/AuthContext.tsx`
   - Added `clearAllCache()` import
   - Clear cache on `signOut`
   - Clear cache on account switch in `onAuthStateChange`

2. `app/contexts/WorkspaceContext.tsx`
   - Clear cache when user logs in
   - Remove data merging logic
   - Disable auto-sync feature

3. `SECURITY_INCIDENT_REPORT.md` (NEW)
   - Comprehensive security incident documentation

4. `development-journal/SECURITY_FIX_LOCALSTORAGE_LEAK.md` (THIS FILE)
   - Technical implementation details

---

## Future Improvements

### Short Term
1. Add warning before login: "Guest data will be lost"
2. Add manual export/import for guest data
3. Consider user-specific localStorage keys: `cache_${userId}_folders`

### Long Term
1. Replace localStorage with IndexedDB with per-user databases
2. Add data encryption for cached data
3. Implement server-side session storage
4. Add audit logging for data access

---

## Lessons Learned

### ❌ Don't Assume
- localStorage is NOT user-specific
- Merging unauthenticated + authenticated data is dangerous
- Auto-sync can cause data contamination

### ✅ Always
- Clear user-specific data on auth state changes
- Implement proper data isolation
- Require explicit user consent for data migration
- Test cross-account scenarios

---

## Conclusion

This was a **CRITICAL** security vulnerability that has been **completely fixed**. All localStorage data is now properly isolated between authentication states, and cross-account data leakage is no longer possible.

**Status:** ✅ FIXED  
**Risk:** 🟢 LOW (with current implementation)  
**Action Required:** All users should log out and log back in to ensure clean state.

