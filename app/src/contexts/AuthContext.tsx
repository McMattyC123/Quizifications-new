import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ApiUser } from '../lib/api';

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await api.getToken();
      if (token) {
        const savedUser = await api.getSavedUser();
        if (savedUser) {
          setUser(savedUser);
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const savedUser = await api.getSavedUser();
    if (savedUser) {
      setUser(savedUser);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { user: newUser } = await api.register(email, password, displayName || email.split('@')[0]);
      setUser(newUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await api.login(email, password);
      setUser(loggedInUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
  };

  const deleteAccount = async () => {
    try {
      await api.deleteAccount();
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUser,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
