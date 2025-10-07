import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 전역 변수로 중복 로딩 방지
let isProfileLoading = false;
let profileLoadPromise = null;

export const AuthProvider = ({ children }) => {
  console.log('🔄 AuthProvider 렌더링');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  
  // currentUser를 useRef로도 추적하여 의존성 문제 해결
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const loadUserProfile = useCallback(async () => {
    console.log('🔄 loadUserProfile 호출됨', { 
      isProfileLoading, 
      hasPromise: !!profileLoadPromise,
      hasToken: !!authToken,
      hasUser: !!currentUserRef.current
    });
    
    // 이미 로딩 중이면 기존 Promise 반환
    if (isProfileLoading && profileLoadPromise) {
      console.log('⏳ 이미 로딩 중 - 기존 Promise 재사용');
      return profileLoadPromise;
    }
    
    if (!authToken) {
      console.log('❌ 토큰 없음 - 프로필 로딩 중단');
      setLoading(false);
      return;
    }
    
    if (currentUserRef.current) {
      console.log('✅ 이미 사용자 정보 있음 - 프로필 로딩 건너뜀');
      setLoading(false);
      return;
    }
    
    // 새로운 로딩 시작
    isProfileLoading = true;
    profileLoadPromise = (async () => {
      try {
        console.log('🚀 프로필 API 호출 시작');
        const user = await apiCall('/auth/profile', { token: authToken });
        setCurrentUser(user);
        console.log('✅ 프로필 로딩 완료:', user?.username);
        return user;
      } catch (error) {
        console.error('❌ 프로필 로드 오류:', error);
        logout();
        throw error;
      } finally {
        setLoading(false);
        isProfileLoading = false;
        profileLoadPromise = null;
      }
    })();
    
    return profileLoadPromise;
  }, [authToken]);

  // 초기화 한 번만 실행
  useEffect(() => {
    console.log('🔄 AuthContext 초기화:', { 
      hasToken: !!authToken,
      hasUser: !!currentUser
    });
    
    if (authToken) {
      console.log('🚀 토큰 있음: 프로필 로딩 시작');
      loadUserProfile();
    } else {
      console.log('❌ 토큰 없음: 로딩 상태 해제');
      setLoading(false);
    }
  }, []); // 빈 배열로 한 번만 실행

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

  const logout = useCallback(() => {
    console.log('🚪 로그아웃 실행');
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setInitialized(false); // 초기화 플래그 리셋
    // 전역 상태 리셋
    isProfileLoading = false;
    profileLoadPromise = null;
  }, []);

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
    loadUserProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 