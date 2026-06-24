import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPendingScans = async (currentUser) => {
      if (!currentUser) return;
      const pendingStr = localStorage.getItem('pending_guest_scan');
      if (pendingStr) {
        try {
          const pendingScan = JSON.parse(pendingStr);
          // Remove immediately to prevent race conditions from multiple auth events
          localStorage.removeItem('pending_guest_scan');
          const { error } = await supabase.from('scans').insert([{
            ...pendingScan,
            user_id: currentUser.id,
          }]);
          if (error) {
            // Restore if there was an error
            localStorage.setItem('pending_guest_scan', pendingStr);
            console.error('Supabase error syncing scan:', error);
          }
        } catch (err) {
          console.error('Failed to sync pending scan:', err);
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      checkPendingScans(currentUser);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkPendingScans(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const saveScane = async (scanData) => {
    const scanPayload = {
      ...scanData,
      created_at: new Date().toISOString(),
    };

    if (!user) {
      // Save locally to sync later when they log in
      localStorage.setItem('pending_guest_scan', JSON.stringify(scanPayload));
      return null;
    }

    const { data, error } = await supabase.from('scans').insert([{
      user_id: user.id,
      ...scanPayload,
    }]).select().single();
    
    if (error) { console.error('Scan save error:', error); return null; }
    return data;
  };

  const getScans = async (limit = 30) => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('Scan fetch error:', error); return []; }
    return data || [];
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, saveScane, getScans }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
