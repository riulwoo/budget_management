import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import BalanceSettings from './pages/BalanceSettings';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="balance-settings" element={<BalanceSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App; 