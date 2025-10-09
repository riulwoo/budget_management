import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import './styles/global.css';

// 페이지 컴포넌트들을 lazy loading으로 변경
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Categories = lazy(() => import('./pages/Categories'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Memos = lazy(() => import('./pages/Memos'));
const Statistics = lazy(() => import('./pages/Statistics'));
const AssetManager = lazy(() => import('./pages/AssetManager'));

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
      <Suspense fallback={
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="memos" element={<Memos />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="assets" element={<AssetManager />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App; 