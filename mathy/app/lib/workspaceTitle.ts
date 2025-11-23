import type { User } from '@supabase/supabase-js';

export function getOwnerName(user: User | null): string | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  
  // Priority order: preferred_name -> first + last -> full_name -> name -> email
  const candidates: Array<unknown> = [
    // Google's preferred name (highest priority)
    metadata.preferred_name,
    // First + Last name combination
    metadata.given_name && metadata.family_name 
      ? `${metadata.given_name} ${metadata.family_name}`.trim()
      : null,
    // Individual first or last name if only one is available
    metadata.given_name || metadata.family_name,
    // Full name alternatives
    metadata.full_name,
    metadata.name,
    metadata.displayName,
    metadata.username,
    // Fallback to email username
    user.email?.split('@')[0],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
}

export function getWorkspaceTitle(user: User | null): string {
  const ownerName = getOwnerName(user);
  const base = ownerName ?? 'My';
  const normalized = base.trim();
  if (!normalized) return 'My Workspace';

  const lower = normalized.toLowerCase();
  if (lower === 'my') return 'My Workspace';
  if (lower === 'your') return 'Your Workspace';

  return normalized.endsWith('s') ? `${normalized}' Workspace` : `${normalized}'s Workspace`;
}
