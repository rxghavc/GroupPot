"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on app load
    console.log('AuthContext: Checking for existing token...');
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      console.log('AuthContext: Found saved token, validating...');
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      console.log('AuthContext: No saved token found');
      setLoading(false);
    }
  }, []);

  async function fetchUserProfile(token: string) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.userId,
          username: userData.username,
          email: userData.email,
        });
        setLoading(false);
      } else {
        // Token is invalid, clear it
        console.log('Token validation failed, clearing auth state');
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }

  async function login(email: string, password: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser({
          id: data.userId,
          username: data.username,
          email: email,
        });
        localStorage.setItem('authToken', data.token);
        
        // Handle redirect after a delay to show success message
        setTimeout(() => {
          const finalRedirect = redirectTo || 
                               sessionStorage.getItem('redirectAfterAuth') || 
                               '/dashboard';
          sessionStorage.removeItem('redirectAfterAuth');
          router.push(finalRedirect);
        }, 1500);
        
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async function signup(username: string, email: string, password: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser({
          id: data.userId,
          username: data.username,
          email: email,
        });
        localStorage.setItem('authToken', data.token);
        
        // Handle redirect after a delay to show success message
        setTimeout(() => {
          const finalRedirect = redirectTo || '/dashboard';
          router.push(finalRedirect);
        }, 1500);
        
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to create account' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/');
  }

  async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to send reset email' };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async function resetPassword(token: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to reset password' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 