import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FarmerProfile, BuyerProfile } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface AuthContextType {
  user: User | null;
  profile: FarmerProfile | BuyerProfile | null;
  token: string | null;
  loading: boolean;
  login: (mobile: string, pass: string) => Promise<void>;
  registerFarmer: (payload: any) => Promise<void>;
  registerBuyer: (payload: any) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | BuyerProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('krishivaani_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { setLanguage } = useLanguage();

  const loadUser = async () => {
    const savedToken = localStorage.getItem('krishivaani_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      if (data.user.language) {
        setLanguage(data.user.language);
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      localStorage.removeItem('krishivaani_token');
      setUser(null);
      setProfile(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (mobile: string, pass: string) => {
    const res = await api.login(mobile, pass);
    localStorage.setItem('krishivaani_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    if (res.user.language) {
      setLanguage(res.user.language);
    }
  };

  const registerFarmer = async (payload: any) => {
    const res = await api.registerFarmer(payload);
    localStorage.setItem('krishivaani_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    if (res.user.language) {
      setLanguage(res.user.language);
    }
  };

  const registerBuyer = async (payload: any) => {
    const res = await api.registerBuyer(payload);
    localStorage.setItem('krishivaani_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    if (res.user.language) {
      setLanguage(res.user.language);
    }
  };

  const logout = () => {
    localStorage.removeItem('krishivaani_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshMe = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        registerFarmer,
        registerBuyer,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
