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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>통계</h2>
        <div className="btn-group">
          <button 
            className={`btn btn-outline-secondary ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('month')}
          >
            월별
          </button>
          <button 
            className={`btn btn-outline-secondary ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('year')}
          >
            연도별
          </button>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h6>총 수입</h6>
              <h4>{formatAmount(totalIncome)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <h6>총 지출</h6>
              <h4>{formatAmount(totalExpense)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`card ${netAmount >= 0 ? 'bg-primary' : 'bg-warning'} text-white`}>
            <div className="card-body text-center">
              <h6>순이익</h6>
              <h4>{formatAmount(Math.abs(netAmount))}</h4>
              <small>{netAmount >= 0 ? '흑자' : '적자'}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h6>거래 건수</h6>
              <h4>{transactions.length}건</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* 수입 통계 */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>수입 통계</h5>
            </div>
            <div className="card-body">
              {categoryStats.income && categoryStats.income.length > 0 ? (
                categoryStats.income.map((stat, index) => (
                  <div key={stat.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <span 
                          className="badge me-2" 
                          style={{ 
                            backgroundColor: stat.color,
                            color: getTextColor(stat.color)
                          }}
                        >
                          {stat.name}
                        </span>
                        <small className="text-muted">({stat.count}건)</small>
                      </div>
                      <span className="fw-bold text-success">
                        {formatAmount(stat.total)}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ 
                          width: `${calculatePercentage(stat.total, totalIncome)}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {calculatePercentage(stat.total, totalIncome)}% 차지
                    </small>
                  </div>
                ))
              ) : (
                <p className="text-muted">수입 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 지출 통계 */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>지출 통계</h5>
            </div>
            <div className="card-body">
              {categoryStats.expense && categoryStats.expense.length > 0 ? (
                categoryStats.expense.map((stat, index) => (
                  <div key={stat.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <span 
                          className="badge me-2" 
                          style={{ 
                            backgroundColor: stat.color,
                            color: getTextColor(stat.color)
                          }}
                        >
                          {stat.name}
                        </span>
                        <small className="text-muted">({stat.count}건)</small>
                      </div>
                      <span className="fw-bold text-danger">
                        {formatAmount(stat.total)}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-danger" 
                        style={{ 
                          width: `${calculatePercentage(stat.total, totalExpense)}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {calculatePercentage(stat.total, totalExpense)}% 차지
                    </small>
                  </div>
                ))
              ) : (
                <p className="text-muted">지출 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 통계 */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>일별 거래 현황</h5>
            </div>
            <div className="card-body">
              {transactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>수입</th>
                        <th>지출</th>
                        <th>순액</th>
                      </tr>
                    </thead>
                    <tbody>
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
                        .slice(0, 10)
                        .map(([date, amounts]) => (
                          <tr key={date}>
                            <td>{new Date(date).toLocaleDateString('ko-KR')}</td>
                            <td className="text-success">
                              {amounts.income > 0 ? formatAmount(amounts.income) : '-'}
                            </td>
                            <td className="text-danger">
                              {amounts.expense > 0 ? formatAmount(amounts.expense) : '-'}
                            </td>
                            <td className={amounts.income - amounts.expense >= 0 ? 'text-success' : 'text-danger'}>
                              {formatAmount(amounts.income - amounts.expense)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">거래 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>카테고리별 사용 현황</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>수입 카테고리</h6>
                  {categoryStats.income && categoryStats.income.length > 0 ? (
                    <ul className="list-unstyled">
                      {categoryStats.income.slice(0, 5).map(stat => (
                        <li key={stat.id} className="mb-1">
                          <small>
                            <span 
                              className="badge me-1" 
                              style={{ 
                                backgroundColor: stat.color,
                                color: getTextColor(stat.color)
                              }}
                            >
                              {stat.name}
                            </span>
                            {stat.count}건
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">수입 카테고리가 없습니다.</p>
                  )}
                </div>
                <div className="col-6">
                  <h6>지출 카테고리</h6>
                  {categoryStats.expense && categoryStats.expense.length > 0 ? (
                    <ul className="list-unstyled">
                      {categoryStats.expense.slice(0, 5).map(stat => (
                        <li key={stat.id} className="mb-1">
                          <small>
                            <span 
                              className="badge me-1" 
                              style={{ 
                                backgroundColor: stat.color,
                                color: getTextColor(stat.color)
                              }}
                            >
                              {stat.name}
                            </span>
                            {stat.count}건
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">지출 카테고리가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics; 