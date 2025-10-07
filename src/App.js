import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Calendar from './pages/Calendar';
import Memos from './pages/Memos';
import Statistics from './pages/Statistics';
import BalanceSettings from './pages/BalanceSettings';

function App() {
  console.log('🔄 App 컴포넌트 렌더링');
  
  const { authToken, currentUser, loading } = useAuth();
  
  console.log('App 상태:', { 
    hasToken: !!authToken, 
    hasUser: !!currentUser,
    loading: loading
  });

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="memos" element={<Memos />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="balance-settings" element={<BalanceSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App; 