import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { formatAmount } from '../utils/api';

const CategoryChart = () => {
  const { categories, transactions } = useData();
  const [chartState, setChartState] = useState('loading'); // 'loading', 'empty', 'ready'
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    console.log('📊 CategoryChart useEffect 실행:', { 
      categoriesCount: categories?.length || 0, 
      transactionsCount: transactions?.length || 0 
    });

    // 초기 로딩 상태
    setChartState('loading');

    // 짧은 딜레이 후 데이터 처리 (로딩 효과)
    const timer = setTimeout(() => {
      try {
        // 지출 카테고리별 금액 계산
        const expenseCategories = categories?.filter(cat => cat.type === 'expense') || [];
        
        if (expenseCategories.length === 0 || !transactions || transactions.length === 0) {
          console.log('📊 차트 데이터 없음:', { expenseCategories, transactions });
          setChartState('empty');
          return;
        }

        // 카테고리별 금액 합계 계산 (현재 달 기준)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
        
        console.log('📊 월별 거래내역:', { currentMonth, monthlyTransactions });

        const categoryAmounts = expenseCategories.map(category => {
          const amount = monthlyTransactions
            .filter(t => t.type === 'expense' && (t.category_id === category.id || t.category_name === category.name))
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          return {
            ...category,
            amount: amount
          };
        }).filter(cat => cat.amount > 0) // 금액이 0인 카테고리 제외
          .sort((a, b) => b.amount - a.amount) // 금액 순으로 정렬
          .slice(0, 8); // 상위 8개만 표시

        console.log('📊 카테고리 데이터:', categoryAmounts);

        if (categoryAmounts.length === 0) {
          setChartState('empty');
          return;
        }

        // 총액 계산
        const totalAmount = categoryAmounts.reduce((sum, cat) => sum + cat.amount, 0);

        // 차트 데이터 설정
        const processedData = categoryAmounts.map((cat, index) => ({
          ...cat,
          percentage: ((cat.amount / totalAmount) * 100).toFixed(1),
          color: cat.color || generateColor(index)
        }));

        setChartData({
          categories: processedData,
          totalAmount: totalAmount
        });
        setChartState('ready');

      } catch (error) {
        console.error('📊 차트 데이터 처리 오류:', error);
        setChartState('empty');
      }
    }, 300); // 300ms 딜레이

    return () => clearTimeout(timer);
  }, [categories, transactions]);

  // 색상 생성 함수
  const generateColor = (index) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return colors[index % colors.length];
  };

  const renderContent = () => {
    switch (chartState) {
      case 'loading':
        return (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">차트 로딩중...</span>
            </div>
            <p className="mt-2 text-muted">차트를 불러오는 중...</p>
          </div>
        );
      case 'empty':
        return (
          <div className="text-center py-4">
            <i className="fas fa-chart-pie fa-3x text-muted mb-3"></i>
            <h6 className="text-muted">이번 달 지출 내역이 없습니다</h6>
            <small className="text-muted">거래를 추가하면 차트가 표시됩니다.</small>
          </div>
        );
      case 'ready':
        return (
          <div className="css-chart-container">
            {/* 총 지출 요약 */}
            <div className="chart-summary text-center mb-4">
              <h6 className="text-muted mb-1">이번 달 총 지출</h6>
              <h4 className="text-danger fw-bold mb-0">{formatAmount(chartData.totalAmount)}</h4>
            </div>

            {/* 카테고리별 막대 차트 */}
            <div className="category-bars">
              {chartData.categories.map((category, index) => (
                <div key={category.id} className="category-bar-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center">
                      <div 
                        className="category-color-indicator me-2"
                        style={{ 
                          backgroundColor: category.color,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%'
                        }}
                      ></div>
                      <span className="fw-semibold small">{category.name}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold small text-danger">{formatAmount(category.amount)}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{category.percentage}%</div>
                    </div>
                  </div>
                  
                  {/* 프로그레스 바 */}
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div 
                      className="progress-bar"
                      role="progressbar"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color,
                        transition: 'width 0.6s ease'
                      }}
                      aria-valuenow={category.percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* 도넛 차트 스타일 (원형 차트) */}
            <div className="mt-4">
              <div className="donut-chart-container d-flex justify-content-center">
                <div className="donut-chart position-relative" style={{ width: '200px', height: '200px' }}>
                  <svg width="200" height="200" className="donut-svg">
                    {chartData.categories.map((category, index) => {
                      let cumulativePercentage = 0;
                      for (let i = 0; i < index; i++) {
                        cumulativePercentage += parseFloat(chartData.categories[i].percentage);
                      }
                      
                      const startAngle = (cumulativePercentage / 100) * 360 - 90;
                      const endAngle = ((cumulativePercentage + parseFloat(category.percentage)) / 100) * 360 - 90;
                      
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      
                      const largeArcFlag = parseFloat(category.percentage) > 50 ? 1 : 0;
                      
                      const x1 = 100 + 70 * Math.cos(startAngleRad);
                      const y1 = 100 + 70 * Math.sin(startAngleRad);
                      const x2 = 100 + 70 * Math.cos(endAngleRad);
                      const y2 = 100 + 70 * Math.sin(endAngleRad);
                      const x3 = 100 + 40 * Math.cos(endAngleRad);
                      const y3 = 100 + 40 * Math.sin(endAngleRad);
                      const x4 = 100 + 40 * Math.cos(startAngleRad);
                      const y4 = 100 + 40 * Math.sin(startAngleRad);
                      
                      const pathData = `
                        M ${x1} ${y1}
                        A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2}
                        L ${x3} ${y3}
                        A 40 40 0 ${largeArcFlag} 0 ${x4} ${y4}
                        Z
                      `;
                      
                      return (
                        <path
                          key={category.id}
                          d={pathData}
                          fill={category.color}
                          stroke="#fff"
                          strokeWidth="2"
                          className="donut-segment"
                          style={{ 
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      );
                    })}
                  </svg>
                  
                  {/* 중앙 텍스트 */}
                  <div className="donut-center position-absolute top-50 start-50 translate-middle text-center">
                    <div className="small text-muted">총 지출</div>
                    <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>
                      {formatAmount(chartData.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="category-chart-container">
      {renderContent()}
    </div>
  );
};

export default CategoryChart; 