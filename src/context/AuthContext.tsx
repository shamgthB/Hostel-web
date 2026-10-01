import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, OwnerProfile, Resident } from '../types';

interface AuthContextType {
  user: User | null;
  profile: OwnerProfile | null;
  residentInfo: Resident | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  registerOwner: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [residentInfo, setResidentInfo] = useState<Resident | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hostel_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
        setProfile(res.profile);
        setResidentInfo(res.residentInfo);
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('hostel_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login({ identifier, password: pass });
    localStorage.setItem('hostel_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    setResidentInfo(res.residentInfo);
  };

  const registerOwner = async (data: any) => {
    const res = await api.registerOwner(data);
    localStorage.setItem('hostel_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
  };

  const logout = () => {
    localStorage.removeItem('hostel_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setResidentInfo(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
      setProfile(res.profile);
      setResidentInfo(res.residentInfo);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        residentInfo,
        token,
        isLoading,
        login,
        registerOwner,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
