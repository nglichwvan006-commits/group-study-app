import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  avatarUrl?: string | null;
  totalPoints?: number;
  skillTokens?: number;
  level?: number;
  badge?: string;
  bannedUntil?: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setAccessToken(storedToken);
        
        if (parsedUser.bannedUntil && new Date(parsedUser.bannedUntil) > new Date()) {
          logout();
        }
      } catch (e) {
        console.error("Auth initialization error", e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, refresh: string, userData: User) => {
    if (userData.bannedUntil && new Date(userData.bannedUntil) > new Date()) {
      toast.error(`Tài khoản này bị khóa đến ${new Date(userData.bannedUntil).toLocaleDateString()}`);
      return;
    }
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const updatedUser = response.data;
      
      if (updatedUser.bannedUntil && new Date(updatedUser.bannedUntil) > new Date()) {
        logout();
        toast.error(`Bạn bị cấm truy cập đến ${new Date(updatedUser.bannedUntil).toLocaleDateString()}`);
        return;
      }

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      if (error.response?.status === 403) {
        logout();
      }
      console.error('Error refreshing user profile', error);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refreshUser, isLoading, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
