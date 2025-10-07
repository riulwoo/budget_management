import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount } from '../utils/api';

const Statistics = () => {
  const { currentUser } = useAuth();
  const { 
    transactions, 
    categories, 
    monthlyStats, 
    currentMonth,
    setCurrentMonth,
    loading
  } = useData();

  // 통계 페이지에 필요한 데이터만 로드 - 제거 (DataContext에서 자동 처리됨)
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [categoryStats, setCategoryStats] = useState([]);

  // 카테고리별 통계 계산
  useEffect(() => {
    if (!transactions.length) return;

    const stats = {};
    
    transactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.category_id);
      if (!category) return;
      
      if (!stats[category.id]) {
        stats[category.id] = {
          id: category.id,
          name: category.name,
          color: category.color,
          type: category.type,
          total: 0,
          count: 0
        };
      }
      
      stats[category.id].total += parseFloat(transaction.amount);
      stats[category.id].count += 1;
    });

    // 수입/지출별로 정렬
    const incomeStats = Object.values(stats)
      .filter(stat => stat.type === 'income')
      .sort((a, b) => b.total - a.total);
    
    const expenseStats = Object.values(stats)
      .filter(stat => stat.type === 'expense')
      .sort((a, b) => b.total - a.total);

    setCategoryStats({
      income: incomeStats,
      expense: expenseStats
    });
  }, [transactions, categories]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // 여기서 기간별 데이터를 로드하는 로직을 추가할 수 있습니다
  };

  const getTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000' : '#fff';
  };

  const calculatePercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
  };

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <h3>로그인이 필요합니다</h3>
        <p>통계 보기를 위해 로그인해주세요.</p>
      </div>
    );
  }

  const totalIncome = monthlyStats.income?.total || 0;
  const totalExpense = monthlyStats.expense?.total || 0;
  const netAmount = totalIncome - totalExpense;

  return (
    <div className="statistics-page">
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: '700' }}>
            <i className="fas fa-chart-line me-2 text-primary"></i>
            통계 대시보드
          </h2>
          <p className="text-muted mb-0">재정 상태를 한눈에 확인하세요</p>
        </div>
        <div className="btn-group shadow-sm">
          <button 
            className={`btn ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handlePeriodChange('month')}
            style={{ borderRadius: '10px 0 0 10px' }}
          >
            <i className="fas fa-calendar-alt me-1"></i>
            월별
          </button>
          <button 
            className={`btn ${selectedPeriod === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handlePeriodChange('year')}
            style={{ borderRadius: '0 10px 10px 0' }}
          >
            <i className="fas fa-chart-bar me-1"></i>
            연도별
          </button>
        </div>
      </div>

      {/* 전체 요약 - 모던한 카드 디자인 */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" 
               style={{ 
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 borderRadius: '20px'
               }}>
            <div className="card-body text-center text-white p-4">
              <div className="mb-3">
                <i className="fas fa-arrow-up fa-2x" style={{ opacity: 0.9 }}></i>
              </div>
              <h6 className="card-subtitle mb-2" style={{ opacity: 0.8 }}>총 수입</h6>
              <h3 className="card-title mb-2" style={{ fontWeight: '700' }}>
                {formatAmount(totalIncome)}
              </h3>
              <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div className="progress-bar" 
                     style={{ 
                       width: '100%', 
                       backgroundColor: 'rgba(255,255,255,0.8)' 
                     }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" 
               style={{ 
                 background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                 borderRadius: '20px'
               }}>
            <div className="card-body text-center text-white p-4">
              <div className="mb-3">
                <i className="fas fa-arrow-down fa-2x" style={{ opacity: 0.9 }}></i>
              </div>
              <h6 className="card-subtitle mb-2" style={{ opacity: 0.8 }}>총 지출</h6>
              <h3 className="card-title mb-2" style={{ fontWeight: '700' }}>
                {formatAmount(totalExpense)}
              </h3>
              <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div className="progress-bar" 
                     style={{ 
                       width: totalExpense > 0 ? '100%' : '0%', 
                       backgroundColor: 'rgba(255,255,255,0.8)' 
                     }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" 
               style={{ 
                 background: netAmount >= 0 
                   ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
                   : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                 borderRadius: '20px'
               }}>
            <div className="card-body text-center text-white p-4">
              <div className="mb-3">
                <i className={`fas ${netAmount >= 0 ? 'fa-chart-line' : 'fa-exclamation-triangle'} fa-2x`} 
                   style={{ opacity: 0.9 }}></i>
              </div>
              <h6 className="card-subtitle mb-2" style={{ opacity: 0.8 }}>순이익</h6>
              <h3 className="card-title mb-1" style={{ fontWeight: '700' }}>
                {formatAmount(Math.abs(netAmount))}
              </h3>
              <small className="badge" 
                     style={{ 
                       backgroundColor: 'rgba(255,255,255,0.2)', 
                       fontSize: '0.75em' 
                     }}>
                {netAmount >= 0 ? '흑자' : '적자'}
              </small>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" 
               style={{ 
                 background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                 borderRadius: '20px'
               }}>
            <div className="card-body text-center text-white p-4">
              <div className="mb-3">
                <i className="fas fa-receipt fa-2x text-dark" style={{ opacity: 0.7 }}></i>
              </div>
              <h6 className="card-subtitle mb-2 text-dark" style={{ opacity: 0.7 }}>거래 건수</h6>
              <h3 className="card-title mb-2 text-dark" style={{ fontWeight: '700' }}>
                {transactions.length}건
              </h3>
              <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <div className="progress-bar bg-dark" 
                     style={{ 
                       width: transactions.length > 0 ? '100%' : '0%',
                       opacity: 0.6
                     }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리별 상세 통계 */}
      <div className="row g-4">
        {/* 수입 통계 */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-transparent border-0 pb-0" style={{ borderRadius: '20px 20px 0 0' }}>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: '50px', 
                         height: '50px', 
                         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                       }}>
                    <i className="fas fa-arrow-up text-white"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>수입 카테고리</h5>
                  <p className="text-muted mb-0 small">카테고리별 수입 분석</p>
                </div>
              </div>
            </div>
            <div className="card-body pt-3">
              {categoryStats.income && categoryStats.income.length > 0 ? (
                categoryStats.income.slice(0, 5).map((stat, index) => (
                  <div key={stat.id} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-3" 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: stat.color 
                          }}
                        ></div>
                        <div>
                          <span className="fw-semibold" style={{ color: '#2c3e50' }}>
                            {stat.name}
                          </span>
                          <small className="text-muted ms-2">
                            <i className="fas fa-receipt me-1"></i>
                            {stat.count}건
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold" style={{ color: '#27ae60', fontSize: '1.1em' }}>
                          {formatAmount(stat.total)}
                        </div>
                        <small className="text-muted">
                          {calculatePercentage(stat.total, totalIncome)}%
                        </small>
                      </div>
                    </div>
                    <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${calculatePercentage(stat.total, totalIncome)}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '10px'
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  <p className="text-muted mb-0">수입 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 지출 통계 */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-transparent border-0 pb-0" style={{ borderRadius: '20px 20px 0 0' }}>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: '50px', 
                         height: '50px', 
                         background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                       }}>
                    <i className="fas fa-arrow-down text-white"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>지출 카테고리</h5>
                  <p className="text-muted mb-0 small">카테고리별 지출 분석</p>
                </div>
              </div>
            </div>
            <div className="card-body pt-3">
              {categoryStats.expense && categoryStats.expense.length > 0 ? (
                categoryStats.expense.slice(0, 5).map((stat, index) => (
                  <div key={stat.id} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-3" 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: stat.color 
                          }}
                        ></div>
                        <div>
                          <span className="fw-semibold" style={{ color: '#2c3e50' }}>
                            {stat.name}
                          </span>
                          <small className="text-muted ms-2">
                            <i className="fas fa-receipt me-1"></i>
                            {stat.count}건
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold" style={{ color: '#e74c3c', fontSize: '1.1em' }}>
                          {formatAmount(stat.total)}
                        </div>
                        <small className="text-muted">
                          {calculatePercentage(stat.total, totalExpense)}%
                        </small>
                      </div>
                    </div>
                    <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${calculatePercentage(stat.total, totalExpense)}%`,
                          background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                          borderRadius: '10px'
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  <p className="text-muted mb-0">지출 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      <div className="row g-4 mt-3">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: '50px', 
                         height: '50px', 
                         background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
                       }}>
                    <i className="fas fa-calendar-day text-white"></i>
                  </div>
                </div>
                <div>
                  <h5 className="mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>일별 거래 현황</h5>
                  <p className="text-muted mb-0 small">최근 10일간의 수입/지출 내역</p>
                </div>
              </div>
            </div>
            <div className="card-body pt-3">
              {transactions.length > 0 ? (
                <div className="row g-3">
                  {Object.entries(
                    transactions.reduce((acc, transaction) => {
                      const date = transaction.date;
                      if (!acc[date]) {
                        acc[date] = { income: 0, expense: 0 };
                      }
                      if (transaction.type === 'income') {
                        acc[date].income += parseFloat(transaction.amount);
                      } else {
                        acc[date].expense += parseFloat(transaction.amount);
                      }
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 6)
                    .map(([date, amounts]) => {
                      const net = amounts.income - amounts.expense;
                      return (
                        <div key={date} className="col-md-4 col-sm-6">
                          <div className="card border-0" 
                               style={{ 
                                 background: net >= 0 
                                   ? 'linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%)'
                                   : 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%)',
                                 borderRadius: '15px'
                               }}>
                            <div className="card-body p-3 text-center">
                              <div className="d-flex align-items-center justify-content-center mb-2">
                                <i className="fas fa-calendar-alt text-muted me-2"></i>
                                <span className="fw-semibold" style={{ color: '#2c3e50', fontSize: '0.9em' }}>
                                  {new Date(date).toLocaleDateString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              
                              <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <small className="text-muted">수입</small>
                                  <span className="fw-bold" style={{ color: '#27ae60', fontSize: '0.8em' }}>
                                    {amounts.income > 0 ? formatAmount(amounts.income) : '-'}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <small className="text-muted">지출</small>
                                  <span className="fw-bold" style={{ color: '#e74c3c', fontSize: '0.8em' }}>
                                    {amounts.expense > 0 ? formatAmount(amounts.expense) : '-'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="border-top pt-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="fw-semibold text-muted">순액</small>
                                  <span className={`fw-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}
                                        style={{ fontSize: '0.9em' }}>
                                    {formatAmount(Math.abs(net))}
                                    <small className="ms-1">
                                      {net >= 0 ? '흑자' : '적자'}
                                    </small>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-chart-line text-muted mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                  <h6 className="text-muted">거래 데이터가 없습니다</h6>
                  <p className="text-muted small mb-0">거래를 추가하면 일별 통계를 확인할 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리별 통계 */}
      <div className="row g-4 mt-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-transparent border-0 pb-2">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: '45px', 
                         height: '45px', 
                         background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' 
                       }}>
                    <i className="fas fa-arrow-up text-white"></i>
                  </div>
                </div>
                <div>
                  <h6 className="mb-0" style={{ color: '#2c3e50', fontWeight: '600' }}>수입 카테고리</h6>
                  <small className="text-muted">상위 5개 카테고리</small>
                </div>
              </div>
            </div>
            <div className="card-body pt-2">
              {categoryStats.income && categoryStats.income.length > 0 ? (
                <div className="space-y-3">
                  {categoryStats.income.slice(0, 5).map((stat, index) => (
                    <div key={stat.id} className="d-flex align-items-center justify-content-between p-3 rounded-3"
                         style={{ background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.05) 0%, rgba(46, 204, 113, 0.02) 100%)' }}>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-3"
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: stat.color,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        ></div>
                        <div>
                          <span className="fw-semibold" style={{ color: '#2c3e50', fontSize: '0.9em' }}>
                            {stat.name}
                          </span>
                          <div className="text-muted small mt-1">
                            <i className="fas fa-chart-bar me-1" style={{ fontSize: '0.7em' }}></i>
                            {stat.count}건의 거래
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge rounded-pill" 
                              style={{ 
                                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                                color: 'white',
                                fontSize: '0.75em'
                              }}>
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-tags text-muted mb-2" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                  <p className="text-muted small mb-0">수입 카테고리가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div className="card-header bg-transparent border-0 pb-2">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                       style={{ 
                         width: '45px', 
                         height: '45px', 
                         background: 'linear-gradient(135deg, #e74c3c 0%, #ec7063 100%)' 
                       }}>
                    <i className="fas fa-arrow-down text-white"></i>
                  </div>
                </div>
                <div>
                  <h6 className="mb-0" style={{ color: '#2c3e50', fontWeight: '600' }}>지출 카테고리</h6>
                  <small className="text-muted">상위 5개 카테고리</small>
                </div>
              </div>
            </div>
            <div className="card-body pt-2">
              {categoryStats.expense && categoryStats.expense.length > 0 ? (
                <div className="space-y-3">
                  {categoryStats.expense.slice(0, 5).map((stat, index) => (
                    <div key={stat.id} className="d-flex align-items-center justify-content-between p-3 rounded-3"
                         style={{ background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.05) 0%, rgba(236, 112, 99, 0.02) 100%)' }}>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle me-3"
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: stat.color,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        ></div>
                        <div>
                          <span className="fw-semibold" style={{ color: '#2c3e50', fontSize: '0.9em' }}>
                            {stat.name}
                          </span>
                          <div className="text-muted small mt-1">
                            <i className="fas fa-chart-bar me-1" style={{ fontSize: '0.7em' }}></i>
                            {stat.count}건의 거래
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge rounded-pill" 
                              style={{ 
                                background: 'linear-gradient(135deg, #e74c3c 0%, #ec7063 100%)',
                                color: 'white',
                                fontSize: '0.75em'
                              }}>
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-tags text-muted mb-2" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                  <p className="text-muted small mb-0">지출 카테고리가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics; 