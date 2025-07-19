import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount } from '../utils/api';
import TransactionModal from '../components/modals/TransactionModal';
import CategoryChart from '../components/CategoryChart';
import RecentTransactions from '../components/RecentTransactions';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { 
    monthlyStats, 
    totalBalance, 
    loading,
    addTransaction 
  } = useData();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const monthlyBalance = monthlyStats.income.total - monthlyStats.expense.total;

  return (
    <div>
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>대시보드</h2>
        {currentUser && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowTransactionModal(true)}
          >
            <i className="fas fa-plus me-2"></i>거래 추가
          </button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h5>이번 달 수입</h5>
              <h3>{formatAmount(monthlyStats.income.total)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h5>이번 달 지출</h5>
              <h3>{formatAmount(monthlyStats.expense.total)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h5>이번 달 잔액</h5>
              <h3>{formatAmount(monthlyBalance)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5>총 잔액</h5>
              <h3>{formatAmount(totalBalance.current_balance)}</h3>
              <small>초기 자본금 포함</small>
            </div>
          </div>
        </div>
      </div>

      {/* 차트와 거래내역 */}
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>최근 거래내역</h5>
            </div>
            <div className="card-body">
              <RecentTransactions />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>카테고리별 지출</h5>
            </div>
            <div className="card-body">
              <CategoryChart />
            </div>
          </div>
        </div>
      </div>

      {/* 거래 추가 모달 */}
      <TransactionModal 
        show={showTransactionModal}
        onHide={() => setShowTransactionModal(false)}
        onSubmit={addTransaction}
      />
    </div>
  );
};

export default Dashboard; 