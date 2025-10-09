import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount } from '../utils/api';

const TransactionModal = lazy(() => import('../components/modals/TransactionModal'));
import CategoryChart from '../components/CategoryChart';
import RecentTransactions from '../components/RecentTransactions';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { 
    monthlyStats, 
    totalBalance, 
    loading,
    addTransaction,
    transactions,
    categories 
  } = useData();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const monthlyBalance = monthlyStats.income.total - monthlyStats.expense.total;
  
  // 추가 통계 계산
  const todayTransactions = transactions?.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.date === today;
  }).length || 0;

  const weeklyBalance = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekTransactions = transactions?.filter(t => new Date(t.date) >= oneWeekAgo) || [];
    const income = weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return income - expense;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <div className="card dashboard-welcome-card">
          <div className="card-body">
            <i className="fas fa-tachometer-alt fa-4x text-primary mb-3"></i>
            <h3>대시보드에 오신 것을 환영합니다!</h3>
            <p>로그인하여 가계부 관리를 시작해보세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 헤더 */}
      <div className="dashboard-header">
        <div className="row align-items-center mb-4">
          <div className="col-12 col-md-8 mb-3 mb-md-0">
            <h2 className="dashboard-title">
              <i className="fas fa-tachometer-alt me-2"></i>
              <span className="d-none d-sm-inline">대시보드</span>
              <span className="d-sm-none">Dashboard</span>
            </h2>
            <p className="dashboard-subtitle text-muted mb-0">
              <span className="d-none d-md-inline">
                안녕하세요, {currentUser?.username}님! 오늘도 좋은 하루 되세요 ✨
              </span>
              <span className="d-md-none">
                안녕하세요, {currentUser?.username}님! ✨
              </span>
            </p>
          </div>
          <div className="col-12 col-md-4 text-end">
            <button 
              className="btn btn-primary dashboard-add-btn w-100 w-md-auto" 
              onClick={() => setShowTransactionModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              <span className="d-none d-sm-inline">거래 추가</span>
              <span className="d-sm-none">추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card dashboard-stat-card income-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-success">
                  <i className="fas fa-arrow-up"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">이번 달 수입</div>
                  <div className="stat-value text-success">{formatAmount(monthlyStats.income.total)}</div>
                  <div className="stat-subtitle">
                    {monthlyStats.income.count}건의 수입
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card dashboard-stat-card expense-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-danger">
                  <i className="fas fa-arrow-down"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">이번 달 지출</div>
                  <div className="stat-value text-danger">{formatAmount(monthlyStats.expense.total)}</div>
                  <div className="stat-subtitle">
                    {monthlyStats.expense.count}건의 지출
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <div className={`card dashboard-stat-card ${monthlyBalance >= 0 ? 'balance-positive-card' : 'balance-negative-card'}`}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className={`stat-icon ${monthlyBalance >= 0 ? 'bg-info' : 'bg-warning'}`}>
                  <i className={`fas ${monthlyBalance >= 0 ? 'fa-plus' : 'fa-minus'}`}></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">이번 달 잔액</div>
                  <div className={`stat-value ${monthlyBalance >= 0 ? 'text-info' : 'text-warning'}`}>
                    {formatAmount(Math.abs(monthlyBalance))}
                  </div>
                  <div className="stat-subtitle">
                    {monthlyBalance >= 0 ? '흑자' : '적자'} 운영
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card dashboard-stat-card total-balance-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-primary">
                  <i className="fas fa-wallet"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">총 잔액</div>
                  <div className="stat-value text-primary">{formatAmount(totalBalance.current_balance)}</div>
                  <div className="stat-subtitle">
                    초기 자본금 포함
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 통계 카드 */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card dashboard-quick-stat">
            <div className="card-body text-center">
              <i className="fas fa-calendar-day fa-2x mb-2 text-primary"></i>
              <div className="quick-stat-value">{todayTransactions}</div>
              <div className="quick-stat-label">오늘의 거래</div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card dashboard-quick-stat">
            <div className="card-body text-center">
              <i className="fas fa-calendar-week fa-2x mb-2 text-success"></i>
              <div className="quick-stat-value">{formatAmount(Math.abs(weeklyBalance()))}</div>
              <div className="quick-stat-label">
                이번 주 {weeklyBalance() >= 0 ? '수익' : '손실'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card dashboard-quick-stat">
            <div className="card-body text-center">
              <i className="fas fa-tags fa-2x mb-2 text-info"></i>
              <div className="quick-stat-value">{categories?.length || 0}</div>
              <div className="quick-stat-label">활성 카테고리</div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card dashboard-content-card">
            <div className="card-header dashboard-card-header">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="header-icon bg-primary me-3">
                    <i className="fas fa-history"></i>
                  </div>
                  <div>
                    <h5 className="mb-0">최근 거래내역</h5>
                    <small className="text-muted">최신 거래 내역을 확인하세요</small>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="fas fa-eye me-1"></i>전체보기
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <RecentTransactions />
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 mb-4">
          <div className="card dashboard-content-card">
            <div className="card-header dashboard-card-header">
              <div className="d-flex align-items-center">
                <div className="header-icon bg-success me-3">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div>
                  <h5 className="mb-0">카테고리별 지출</h5>
                  <small className="text-muted">지출 분석을 확인하세요</small>
                </div>
              </div>
            </div>
            <div className="card-body">
              <CategoryChart />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 요약 정보 */}
      <div className="row">
        <div className="col-12">
          <div className="card dashboard-summary-card">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <div className="summary-item">
                    <i className="fas fa-coins text-warning fa-2x mb-2"></i>
                    <div className="summary-value">{formatAmount(totalBalance.current_balance)}</div>
                    <div className="summary-label">현재 총 자산</div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <div className="summary-item">
                    <i className="fas fa-chart-line text-info fa-2x mb-2"></i>
                    <div className="summary-value">
                      {monthlyBalance >= 0 ? '+' : ''}{formatAmount(monthlyBalance)}
                    </div>
                    <div className="summary-label">이번 달 수지</div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <div className="summary-item">
                    <i className="fas fa-calendar-alt text-purple fa-2x mb-2"></i>
                    <div className="summary-value">{transactions?.length || 0}</div>
                    <div className="summary-label">총 거래 건수</div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <div className="summary-item">
                    <i className="fas fa-percentage text-success fa-2x mb-2"></i>
                    <div className="summary-value">
                      {monthlyStats.expense.total > 0 
                        ? Math.round((monthlyStats.income.total / monthlyStats.expense.total) * 100) 
                        : 0}%
                    </div>
                    <div className="summary-label">수입 대비 지출률</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 거래 추가 모달 */}
      {showTransactionModal && (
        <Suspense fallback={
          <div className="modal fade show" style={{display: 'block'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <TransactionModal 
            show={showTransactionModal}
            onHide={() => setShowTransactionModal(false)}
            onSubmit={addTransaction}
            categories={categories}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Dashboard; 