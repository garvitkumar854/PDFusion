
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut, type Auth } from 'firebase/auth';
import { auth as authInstance } from '@/lib/firebase';

interface User extends FirebaseUser {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any | null; }>;
  signOut: () => Promise<{ error: any | null; }>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true,
    signIn: async () => ({ user: null, error: new Error('Auth provider not initialized') }),
    signOut: async () => ({ error: new Error('Auth provider not initialized') }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authInstance) {
      const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
        setUser(firebaseUser as User);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If auth is not available, we are not in a loading state from Firebase.
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!authInstance) return { user: null, error: new Error("Firebase is not configured.") };
    try {
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      return { user: userCredential.user as User, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    if (!authInstance) return { error: new Error("Firebase is not configured.") };
    try {
      await firebaseSignOut(authInstance);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
