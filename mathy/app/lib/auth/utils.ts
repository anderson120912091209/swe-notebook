import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

