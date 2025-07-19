import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      const data = await apiCall('/categories', { token: authToken });
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

  // 거래내역 로드
  const loadTransactions = async (year, month) => {
    try {
      console.log('Loading transactions for year:', year, 'month:', month);
      const data = await apiCall(`/transactions/${year}/${month}`, { token: authToken });
      console.log('Loaded transactions:', data);
      setTransactions(data);
    } catch (error) {
      console.error('거래내역 로드 오류:', error);
      setTransactions([]);
    }
  };

  // 월별 통계 로드
  const loadMonthlyStats = async (year, month) => {
    try {
      const data = await apiCall(`/stats/${year}/${month}`, { token: authToken });
      setMonthlyStats(data);
    } catch (error) {
      console.error('월별 통계 로드 오류:', error);
    }
  };

  // 총 잔액 로드
  const loadTotalBalance = async () => {
    if (!currentUser) return;
    
    try {
      const data = await apiCall('/balance/total', { token: authToken });
      setTotalBalance(data);
    } catch (error) {
      console.error('총 잔액 로드 오류:', error);
    }
  };

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
      await apiCall(`/transactions/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      
      // 거래내역 다시 로드
      const [year, month] = currentMonth.split('-');
      await loadTransactions(year, month);
      await loadMonthlyStats(year, month);
      await loadTotalBalance();
      
      return { success: true };
    } catch (error) {
      console.error('거래 삭제 오류:', error);
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

  // 사용자 변경 시 데이터 로드
  useEffect(() => {
    if (currentUser) {
      console.log('Loading data for user:', currentUser.username);
      console.log('Current month:', currentMonth);
      
      loadCategories();
      loadTotalBalance();
      const [year, month] = currentMonth.split('-');
      console.log('Loading transactions for:', year, month);
      loadTransactions(year, month);
      loadMonthlyStats(year, month);
    } else {
      console.log('No current user, clearing data');
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
  }, [currentUser, currentMonth]);

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
    addTransaction,
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