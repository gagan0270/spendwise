import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
  avatarUrl?: string;
}

const DEMO_STORAGE_KEY = 'spendwise_demo_user';

export const DEMO_USER: UserProfile = {
  id: 'demo-student-alex-001',
  email: 'alex.demo@spendwise.edu',
  name: 'Alex Chen',
  isDemo: true,
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  // Check local demo session
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as UserProfile;
    } catch {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }

  // Check Supabase session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student',
        isDemo: false,
      };
    }
  } catch (err) {
    console.warn('Could not read Supabase session:', err);
  }

  return null;
}

export function signInWithDemo(): UserProfile {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_USER));
  return DEMO_USER;
}

export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed.');
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    name: data.user.user_metadata?.name || email.split('@')[0],
    isDemo: false,
  };
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<UserProfile> {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sign up failed.');
  return {
    id: data.user.id,
    email: data.user.email ?? email,
    name: name || email.split('@')[0],
    isDemo: false,
  };
}

export async function signOutUser(): Promise<void> {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase sign out warning:', err);
  }
}
