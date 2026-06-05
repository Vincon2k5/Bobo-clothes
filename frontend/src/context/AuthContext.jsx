import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Đang kiểm tra session

  // Khôi phục session từ localStorage khi app load
  useEffect(() => {
    const token = localStorage.getItem('bobo_token');
    const stored = localStorage.getItem('bobo_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('bobo_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { data: userData, token } = response;
    localStorage.setItem('bobo_token', token);
    localStorage.setItem('bobo_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async ({ fullName, email, password, phone }) => {
    const response = await api.post('/auth/register', { fullName, email, password, phone });
    const { data: userData, token } = response;
    localStorage.setItem('bobo_token', token);
    localStorage.setItem('bobo_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('bobo_token');
    localStorage.removeItem('bobo_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
};
