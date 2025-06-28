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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
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
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
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
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
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
        
        // Add a small delay to show success message before redirect
        setTimeout(() => {
          const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
          sessionStorage.removeItem('redirectAfterAuth');
          router.push(redirectTo);
        }, 1500); // 1.5 second delay
        
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function signup(username: string, email: string, password: string): Promise<boolean> {
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
        
        // Add a small delay to show success message before redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500); // 1.5 second delay
        
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/');
  }

  async function forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  }

  async function resetPassword(token: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      return response.ok;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
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