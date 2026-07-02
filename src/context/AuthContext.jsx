import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSetup(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleUserSetup(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Safely creates profile/role if they don't exist (without overwriting Admins)
  const handleUserSetup = async (userId) => {
    try {
      // 1. Ensure role exists
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!roleData) {
        await supabase.from('user_roles').insert({ user_id: userId, role: 'user' });
      }

      // 2. Ensure profile exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileData) {
        await supabase.from('profiles').insert({ id: userId });
      }

      // 3. Fetch actual role to set isAdmin state
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      setIsAdmin(role?.role === 'admin');
    } catch (error) {
      console.error('Error setting up user:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = { user, isAdmin, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}