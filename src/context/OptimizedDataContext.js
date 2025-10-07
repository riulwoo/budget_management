import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

// 페이지별 필요 데이터 정의
const PAGE_DATA_REQUIREMENTS = {
  '/': ['categories', 'transactions', 'monthlyStats', 'totalBalance'],
  '/transactions': ['categories', 'transactions'],
  '/categories': ['categories'],
  '/calendar': ['transactions'],
  '/memos': [], // 메모는 별도 관리
  '/statistics': ['categories', 'monthlyStats', 'totalBalance'],
  '/balance-settings': ['totalBalance']
};

export const DataProvider = ({ children }) => {
  const { currentUser, authToken } = useAuth();
  const location = useLocation();
  
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
  const [loadedData, setLoadedData] = useState(new Set());

  // 현재 페이지에서 필요한 데이터 타입 확인
  const getRequiredDataForCurrentPage = () => {
    return PAGE_DATA_REQUIREMENTS[location.pathname] || [];
  };

  // 카테고리 로드
  const loadCategories = async (force = false) => {
    if (!force && loadedData.has('categories')) return;
    
    try {
      const data = await apiCall('/categories', { token: authToken });
      setCategories(data);
      setLoadedData(prev => new Set([...prev, 'categories']));
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

  // 거래내역 로드
  const loadTransactions = async (year, month, force = false) => {
    const key = `transactions-${year}-${month}`;
    if (!force && loadedData.has(key)) return;

    try {
      const data = await apiCall(`/transactions/${year}/${month}`, { token: authToken });
      setTransactions(data);
      setLoadedData(prev => new Set([...prev, key]));
    } catch (error) {
      console.error('거래내역 로드 오류:', error);
      setTransactions([]);
    }
  };

  // 월별 통계 로드
  const loadMonthlyStats = async (year, month, force = false) => {
    const key = `monthlyStats-${year}-${month}`;
    if (!force && loadedData.has(key)) return;

    try {
      const data = await apiCall(`/stats/${year}/${month}`, { token: authToken });
      setMonthlyStats(data);
      setLoadedData(prev => new Set([...prev, key]));
    } catch (error) {
      console.error('월별 통계 로드 오류:', error);
    }
  };

  // 총 잔액 로드
  const loadTotalBalance = async (force = false) => {
    if (!currentUser) return;
    if (!force && loadedData.has('totalBalance')) return;
    
    try {
      const data = await apiCall('/balance/total', { token: authToken });
      setTotalBalance(data);
      setLoadedData(prev => new Set([...prev, 'totalBalance']));
    } catch (error) {
      console.error('총 잔액 로드 오류:', error);
    }
  };

  // 페이지별 필요 데이터만 로드
  const loadRequiredDataForPage = async (requiredData = null) => {
    if (!currentUser) return;

    const dataToLoad = requiredData || getRequiredDataForCurrentPage();
    const [year, month] = currentMonth.split('-');

    setLoading(true);
    try {
      const promises = [];

      if (dataToLoad.includes('categories')) {
        promises.push(loadCategories());
      }
      
      if (dataToLoad.includes('transactions')) {
        promises.push(loadTransactions(year, month));
      }
      
      if (dataToLoad.includes('monthlyStats')) {
        promises.push(loadMonthlyStats(year, month));
      }
      
      if (dataToLoad.includes('totalBalance')) {
        promises.push(loadTotalBalance());
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('페이지 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 무효화 (새로고침이 필요한 경우)
  const invalidateData = (dataTypes) => {
    if (Array.isArray(dataTypes)) {
      dataTypes.forEach(type => {
        setLoadedData(prev => {
          const newSet = new Set(prev);
          // 해당 타입의 모든 데이터 제거
          [...newSet].forEach(key => {
            if (key.startsWith(type)) {
              newSet.delete(key);
            }
          });
          return newSet;
        });
      });
    } else {
      setLoadedData(prev => {
        const newSet = new Set(prev);
        newSet.delete(dataTypes);
        return newSet;
      });
    }
  };

  // 거래 추가 (최적화됨)
  const addTransaction = async (transactionData) => {
    try {
      setLoading(true);
      await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
        token: authToken
      });
      
      // 필요한 데이터만 다시 로드
      const [year, month] = currentMonth.split('-');
      const requiredData = getRequiredDataForCurrentPage();
      
      // 해당 데이터 무효화
      invalidateData(['transactions', 'monthlyStats', 'totalBalance']);
      
      // 현재 페이지에서 필요한 데이터만 다시 로드
      if (requiredData.includes('transactions')) {
        await loadTransactions(year, month, true);
      }
      if (requiredData.includes('monthlyStats')) {
        await loadMonthlyStats(year, month, true);
      }
      if (requiredData.includes('totalBalance')) {
        await loadTotalBalance(true);
      }
      
      return { success: true };
    } catch (error) {
      console.error('거래 추가 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 거래 삭제 (최적화됨)
  const deleteTransaction = async (id) => {
    try {
      setLoading(true);
      
      const response = await apiCall(`/transactions/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      
      // 필요한 데이터만 다시 로드
      const [year, month] = currentMonth.split('-');
      const requiredData = getRequiredDataForCurrentPage();
      
      // 해당 데이터 무효화
      invalidateData(['transactions', 'monthlyStats', 'totalBalance']);
      
      // 현재 페이지에서 필요한 데이터만 다시 로드
      if (requiredData.includes('transactions')) {
        await loadTransactions(year, month, true);
      }
      if (requiredData.includes('monthlyStats')) {
        await loadMonthlyStats(year, month, true);
      }
      if (requiredData.includes('totalBalance')) {
        await loadTotalBalance(true);
      }
      
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

  // 거래 수정 (최적화됨)
  const updateTransaction = async (id, transactionData) => {
    try {
      setLoading(true);
      await apiCall(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
        token: authToken
      });
      
      // 필요한 데이터만 다시 로드
      const [year, month] = currentMonth.split('-');
      const requiredData = getRequiredDataForCurrentPage();
      
      // 해당 데이터 무효화
      invalidateData(['transactions', 'monthlyStats', 'totalBalance']);
      
      // 현재 페이지에서 필요한 데이터만 다시 로드
      if (requiredData.includes('transactions')) {
        await loadTransactions(year, month, true);
      }
      if (requiredData.includes('monthlyStats')) {
        await loadMonthlyStats(year, month, true);
      }
      if (requiredData.includes('totalBalance')) {
        await loadTotalBalance(true);
      }
      
      return { success: true };
    } catch (error) {
      console.error('거래 수정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 추가 (최적화됨)
  const addCategory = async (categoryData) => {
    try {
      setLoading(true);
      await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        token: authToken
      });
      
      // 카테고리 데이터만 다시 로드
      invalidateData('categories');
      await loadCategories(true);
      
      return { success: true };
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 수정 (최적화됨)
  const updateCategory = async (id, categoryData) => {
    try {
      setLoading(true);
      await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
        token: authToken
      });
      
      // 카테고리 데이터만 다시 로드
      invalidateData('categories');
      await loadCategories(true);
      
      return { success: true };
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 삭제 (최적화됨)
  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      await apiCall(`/categories/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      
      // 카테고리 데이터만 다시 로드
      invalidateData('categories');
      await loadCategories(true);
      
      return { success: true };
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 초기 자본금 설정 (최적화됨)
  const setInitialBalance = async (amount) => {
    try {
      setLoading(true);
      await apiCall('/balance/initial', {
        method: 'POST',
        body: JSON.stringify({ amount }),
        token: authToken
      });
      
      // 잔액 데이터만 다시 로드
      invalidateData('totalBalance');
      await loadTotalBalance(true);
      
      return { success: true };
    } catch (error) {
      console.error('초기 자본금 설정 오류:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 사용자 변경 시 데이터 초기화
  useEffect(() => {
    if (!currentUser) {
      setCategories([]);
      setTransactions([]);
      setMonthlyStats({ income: { total: 0 }, expense: { total: 0 } });
      setTotalBalance({
        initial_balance: 0,
        total_income: 0,
        total_expense: 0,
        current_balance: 0
      });
      setLoadedData(new Set());
    }
  }, [currentUser]);

  // 페이지 변경 시 필요한 데이터만 로드
  useEffect(() => {
    if (currentUser) {
      loadRequiredDataForPage();
    }
  }, [currentUser, location.pathname]);

  // 월 변경 시 관련 데이터 무효화 및 재로드
  useEffect(() => {
    if (currentUser) {
      // 월이 변경되면 해당 월의 데이터 무효화
      invalidateData(['transactions', 'monthlyStats']);
      loadRequiredDataForPage();
    }
  }, [currentMonth]);

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
    loadRequiredDataForPage,
    invalidateData,
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