import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authToken) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [authToken]);

  const loadUserProfile = async () => {
    try {
      const user = await apiCall('/auth/profile', { token: authToken });
      setCurrentUser(user);
    } catch (error) {
      console.error('사용자 프로필 로드 오류:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        const token = data.data.token;
        const user = data.data.user;
        
        setAuthToken(token);
        setCurrentUser(user);
        localStorage.setItem('authToken', token);
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (data.success) {
        const token = data.data.token;
        const user = data.data.user;
        
        setAuthToken(token);
        setCurrentUser(user);
        localStorage.setItem('authToken', token);
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
    }
  };

  const value = {
    currentUser,
    authToken,
    loading,
    login,
    register,
    logout,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 