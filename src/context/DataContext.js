import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiCall } from '../utils/api';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { currentUser, authToken } = useAuth();
  
  // currentUser 객체 재생성으로 인한 불필요한 리렌더링 방지
  const userId = useMemo(() => currentUser?.id, [currentUser?.id]);
  const isLoggedIn = useMemo(() => !!userId, [userId]);
  
  // 전역 로딩 상태 관리 (useRef로 리렌더링 방지)
  const loadingStates = useRef(new Map());
  const lastUserIdRef = useRef(null);
  
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [monthlyStats, setMonthlyStats] = useState({
    income: { total: 0 },
    expense: { total: 0 }
  });
  const [totalBalance, setTotalBalance] = useState({
    initial_balance: 0,
    total_income: 0,
    total_expense: 0,
    current_balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [loadedData, setLoadedData] = useState(new Set()); // 로드된 데이터 추적

  // 카테고리 로드
  const loadCategories = useCallback(async () => {
    const key = 'categories';
    
    // 이미 로드된 경우
    if (loadedData.has(key)) {
      console.log('📋 Categories already loaded');
      return;
    }
    
    // 현재 로딩 중인 경우
    if (loadingStates.current.has(key)) {
      console.log('⏳ Categories loading in progress, waiting...');
      return loadingStates.current.get(key);
    }
    
    // 새로운 로딩 시작
    const loadPromise = (async () => {
      try {
        console.log('🔄 Loading categories...');
        setLoadedData(prev => new Set([...prev, key]));
        const data = await apiCall('/categories', { token: authToken });
        console.log('✅ Categories loaded:', data.length, 'items');
        setCategories(data);
        return data;
      } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
        setLoadedData(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        throw error;
      } finally {
        loadingStates.current.delete(key);
      }
    })();
    
    loadingStates.current.set(key, loadPromise);
    return loadPromise;
  }, [authToken]);

  // 거래내역 로드
  const loadTransactions = useCallback(async (year, month) => {
    const key = `transactions-${year}-${month}`;
    
    // 이미 로드된 경우
    if (loadedData.has(key)) {
      console.log('📋 Transactions already loaded for:', year, month);
      return;
    }
    
    // 현재 로딩 중인 경우
    if (loadingStates.current.has(key)) {
      console.log('⏳ Transactions loading in progress for:', year, month, 'waiting...');
      return loadingStates.current.get(key);
    }
    
    // 새로운 로딩 시작
    const loadPromise = (async () => {
      try {
        console.log('🔄 Loading transactions for year:', year, 'month:', month);
        setLoadedData(prev => new Set([...prev, key]));
        const data = await apiCall(`/transactions/${year}/${month}`, { token: authToken });
        console.log('✅ Loaded transactions:', data.length, 'items');
        setTransactions(data);
        return data;
      } catch (error) {
        console.error('❌ 거래내역 로드 오류:', error);
        setTransactions([]);
        setLoadedData(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        throw error;
      } finally {
        loadingStates.current.delete(key);
      }
    })();
    
    loadingStates.current.set(key, loadPromise);
    return loadPromise;
  }, [authToken]);

  // 월별 통계 로드
  const loadMonthlyStats = useCallback(async (year, month) => {
    const key = `monthlyStats-${year}-${month}`;
    
    // 이미 로드된 경우
    if (loadedData.has(key)) {
      console.log('📋 Monthly stats already loaded for:', year, month);
      return;
    }
    
    // 현재 로딩 중인 경우
    if (loadingStates.current.has(key)) {
      console.log('⏳ Monthly stats loading in progress for:', year, month, 'waiting...');
      return loadingStates.current.get(key);
    }
    
    // 새로운 로딩 시작
    const loadPromise = (async () => {
      try {
        console.log('🔄 Loading monthly stats for year:', year, 'month:', month);
        setLoadedData(prev => new Set([...prev, key]));
        const data = await apiCall(`/stats/${year}/${month}`, { token: authToken });
        console.log('✅ Monthly stats loaded:', data);
        setMonthlyStats(data);
        return data;
      } catch (error) {
        console.error('❌ 월별 통계 로드 오류:', error);
        setLoadedData(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        throw error;
      } finally {
        loadingStates.current.delete(key);
      }
    })();
    
    loadingStates.current.set(key, loadPromise);
    return loadPromise;
  }, [authToken]);

  // 총 잔액 로드
  const loadTotalBalance = useCallback(async () => {
    const key = 'totalBalance';
    
    // 로그인하지 않은 경우
    if (!isLoggedIn) {
      console.log('❌ Not logged in, skipping balance load');
      return;
    }
    
    // 이미 로드된 경우
    if (loadedData.has(key)) {
      console.log('📋 Total balance already loaded');
      return;
    }
    
    // 현재 로딩 중인 경우
    if (loadingStates.current.has(key)) {
      console.log('⏳ Total balance loading in progress, waiting...');
      return loadingStates.current.get(key);
    }
    
    // 새로운 로딩 시작
    const loadPromise = (async () => {
      try {
        console.log('🔄 Loading total balance...');
        setLoadedData(prev => new Set([...prev, key]));
        const data = await apiCall('/balance/total', { token: authToken });
        console.log('✅ Total balance loaded:', data);
        setTotalBalance(data);
        return data;
      } catch (error) {
        console.error('❌ 총 잔액 로드 오류:', error);
        setLoadedData(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        throw error;
      } finally {
        loadingStates.current.delete(key);
      }
    })();
    
    loadingStates.current.set(key, loadPromise);
    return loadPromise;
  }, [authToken, isLoggedIn]);

  // 거래 추가
  const addTransaction = async (transactionData) => {
    try {
      setLoading(true);
      await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        token: authToken
      });
      
      // 거래내역 다시 로드
      const [year, month] = currentMonth.split('-');
      await loadTransactions(year, month);
      await loadMonthlyStats(year, month);
      await loadTotalBalance();
      
      return { success: true };
    } catch (error) {
      console.error('거래 추가 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 거래 삭제
  const deleteTransaction = async (id) => {
    try {
      setLoading(true);
      console.log('거래 삭제 시도:', id);
      
      const response = await apiCall(`/transactions/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      
      console.log('삭제 응답:', response);
      
      // 거래내역 다시 로드
      const [year, month] = currentMonth.split('-');
      await loadTransactions(year, month);
      await loadMonthlyStats(year, month);
      await loadTotalBalance();
      
      return { success: true, message: '거래가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      console.error('거래 삭제 오류:', error);
      return { 
        success: false, 
        message: error.message || '거래 삭제 중 오류가 발생했습니다.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // 거래 수정
  const updateTransaction = async (id, transactionData) => {
    try {
      setLoading(true);
      await apiCall(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
        token: authToken
      });
      
      // 거래내역 다시 로드
      const [year, month] = currentMonth.split('-');
      await loadTransactions(year, month);
      await loadMonthlyStats(year, month);
      await loadTotalBalance();
      
      return { success: true };
    } catch (error) {
      console.error('거래 수정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 추가
  const addCategory = async (categoryData) => {
    try {
      setLoading(true);
      await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        token: authToken
      });
      
      await loadCategories();
      return { success: true };
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 수정
  const updateCategory = async (id, categoryData) => {
    try {
      setLoading(true);
      await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
        token: authToken
      });
      
      await loadCategories();
      return { success: true };
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 삭제
  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      await apiCall(`/categories/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      
      await loadCategories();
      return { success: true };
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 초기 자본금 설정
  const setInitialBalance = async (amount) => {
    try {
      setLoading(true);
      await apiCall('/balance/initial', {
        method: 'POST',
        body: JSON.stringify({ amount }),
        token: authToken
      });
      
      await loadTotalBalance();
      return { success: true };
    } catch (error) {
      console.error('초기 자본금 설정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 페이지별 필요 데이터 확인
  const getRequiredDataForCurrentPage = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
        return ['categories', 'transactions', 'monthlyStats', 'totalBalance'];
      case '/transactions':
        return ['categories', 'transactions'];
      case '/categories':
        return ['categories'];
      case '/calendar':
        return ['transactions'];
      case '/memos':
        return []; // 메모는 별도 관리
      case '/statistics':
        return ['categories', 'monthlyStats', 'totalBalance'];
      case '/balance-settings':
        return ['totalBalance'];
      default:
        return ['categories', 'transactions', 'monthlyStats', 'totalBalance'];
    }
  };

  // 사용자 변경 시 데이터 로드 (최적화됨)
  useEffect(() => {
    console.log('🔄 DataProvider useEffect 실행:', { 
      userId, 
      lastUserId: lastUserIdRef.current,
      isLoggedIn, 
      currentMonth,
      hasAuthToken: !!authToken 
    });

    // 사용자가 변경되었는지 체크
    if (lastUserIdRef.current !== userId) {
      console.log('👤 User changed, clearing all caches');
      // 사용자 변경 시 모든 캐시와 로딩 상태 초기화
      setLoadedData(new Set());
      loadingStates.current.clear();
      lastUserIdRef.current = userId;
      
      // 데이터 초기화
      setCategories([]);
      setTransactions([]);
      setMonthlyStats({ income: { total: 0 }, expense: { total: 0 } });
      setTotalBalance({
        initial_balance: 0,
        total_income: 0,
        total_expense: 0,
        current_balance: 0
      });
    }

    if (isLoggedIn && authToken) {
      // 페이지별 필요 데이터만 로드
      const requiredData = getRequiredDataForCurrentPage();
      console.log('📊 Required data for current page:', requiredData);
      
      // 필요한 데이터만 로드
      if (requiredData.includes('categories')) {
        loadCategories();
      }
      if (requiredData.includes('totalBalance')) {
        loadTotalBalance();
      }
      
      const [year, month] = currentMonth.split('-');
      if (requiredData.includes('transactions')) {
        console.log('📈 Loading transactions for:', year, month);
        loadTransactions(year, month);
      }
      if (requiredData.includes('monthlyStats')) {
        loadMonthlyStats(year, month);
      }
    } else if (!isLoggedIn) {
      console.log('🧹 No current user, clearing data');
      setCategories([]);
      setTransactions([]);
      setMonthlyStats({ income: { total: 0 }, expense: { total: 0 } });
      setTotalBalance({
        initial_balance: 0,
        total_income: 0,
        total_expense: 0,
        current_balance: 0
      });
      setLoadedData(new Set()); // 로드된 데이터 추적 초기화
      loadingStates.current.clear();
    }
    // 안정적인 의존성 사용: userId와 authToken 존재 여부만 체크
  }, [userId, isLoggedIn, authToken, currentMonth]);

  // 월 변경 시 해당 월의 데이터 무효화
  useEffect(() => {
    if (isLoggedIn) {
      console.log('📅 Month changed, invalidating month-specific data:', currentMonth);
      // 이전 월의 데이터 무효화
      invalidateData([`monthlyStats`, `transactions`]);
    }
  }, [currentMonth, isLoggedIn]);

  // 데이터 무효화 함수 (새로운 데이터가 필요할 때 사용)
  const invalidateData = (dataTypes) => {
    if (Array.isArray(dataTypes)) {
      setLoadedData(prev => {
        const newSet = new Set(prev);
        dataTypes.forEach(type => {
          // 해당 타입의 모든 데이터 제거
          [...newSet].forEach(key => {
            if (key.startsWith(type)) {
              newSet.delete(key);
            }
          });
        });
        return newSet;
      });
    } else {
      setLoadedData(prev => {
        const newSet = new Set(prev);
        newSet.delete(dataTypes);
        return newSet;
      });
    }
  };

  const value = {
    categories,
    transactions,
    currentMonth,
    monthlyStats,
    totalBalance,
    loading,
    setCurrentMonth,
    loadCategories,
    loadTransactions,
    loadMonthlyStats,
    loadTotalBalance,
    invalidateData, // 데이터 무효화 함수
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    setInitialBalance
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 