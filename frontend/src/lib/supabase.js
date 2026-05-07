import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If keys are placeholders or empty, we export a mock client to prevent the app from crashing.
const isInvalidKey = !supabaseUrl || supabaseUrl.includes('YOUR_') || !supabaseUrl.startsWith('http');

export const supabase = isInvalidKey 
  ? {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => { alert("Supabase not configured. Add keys to frontend/.env"); return { error: null }; },
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Not configured' } }) }) }),
        select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) })
      })
    }
  : createClient(supabaseUrl, supabaseAnonKey);
