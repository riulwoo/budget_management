import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TransactionModal from '../components/modals/TransactionModal';
import { formatAmount } from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';

const Calendar = () => {
  const { currentUser } = useAuth();
  const { 
    transactions, 
    categories, 
    currentMonth, 
    setCurrentMonth,
    addTransaction,
    loading 
  } = useData();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentWeek, setCurrentWeek] = useState(0);

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('Calendar Debug Info:', {
      currentUser,
      currentMonth,
      transactionsCount: transactions.length,
      categoriesCount: categories.length,
      loading,
      calendarDataLength: calendarData.length
    });
  }, [currentUser, currentMonth, transactions, categories, loading, calendarData]);

  // 달력 데이터 생성
  useEffect(() => {
    if (!currentMonth) {
      console.log('currentMonth is not available');
      return;
    }
    
    console.log('Generating calendar data for month:', currentMonth);
    
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const currentDate = new Date(startDate);
    
    // 6주치 달력 생성
    for (let week = 0; week < 6; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayTransactions = transactions.filter(t => 
          t.date === dateStr
        );
        
        weekData.push({
          date: new Date(currentDate),
          dateStr,
          isCurrentMonth: currentDate.getMonth() === month - 1,
          transactions: dayTransactions,
          totalIncome: dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          totalExpense: dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendar.push(weekData);
    }
    
    console.log('Generated calendar data:', calendar);
    setCalendarData(calendar);
  }, [currentMonth, transactions]);

  const handleDateClick = (dateData) => {
    if (dateData.isCurrentMonth) {
      setSelectedDate(dateData.dateStr);
      setShowTransactionModal(true);
    }
  };

  const handleTransactionSubmit = async (transactionData) => {
    const result = await addTransaction({
      ...transactionData,
      date: selectedDate
    });
    
    if (result.success) {
      setShowTransactionModal(false);
      setSelectedDate(null);
    }
    return result;
  };

  const handleMonthChange = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      if (month === 1) {
        newMonth = 12;
        newYear = year - 1;
      } else {
        newMonth = month - 1;
      }
    } else {
      if (month === 12) {
        newMonth = 1;
        newYear = year + 1;
      } else {
        newMonth = month + 1;
      }
    }
    
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    setCurrentWeek(0);
  };

  const handleWeekChange = (direction) => {
    if (direction === 'prev' && currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    } else if (direction === 'next' && currentWeek < 5) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const getDayClass = (dateData) => {
    let classes = 'calendar-day';
    if (!dateData.isCurrentMonth) {
      classes += ' text-muted';
    }
    if (dateData.transactions.length > 0) {
      classes += ' has-transactions';
    }
    return classes;
  };

  const getDayStyle = (dateData) => {
    if (dateData.transactions.length === 0) return {};
    
    const total = dateData.totalIncome - dateData.totalExpense;
    const intensity = Math.min(Math.abs(total) / 100000, 0.8);
    
    return {
      backgroundColor: total > 0 
        ? `rgba(40, 167, 69, ${intensity})` 
        : `rgba(220, 53, 69, ${intensity})`
    };
  };

  const formatAmountMobile = (amount) => {
    if (amount < 10000) {
      return `₩${Math.round(amount / 1000)}K`;
    } else if (amount < 100000000) {
      return `₩${Math.round(amount / 10000)}만`;
    } else {
      return `₩${Math.round(amount / 100000000)}억`;
    }
  };

  const getWeekRange = () => {
    if (calendarData.length === 0) return '';
    
    const week = calendarData[currentWeek];
    const startDate = week[0].date;
    const endDate = week[6].date;
    
    return `${startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`;
  };

  const maxWeek = calendarData.length > 0 ? calendarData.length - 1 : 0;

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <h3>로그인이 필요합니다</h3>
        <p>달력 보기를 위해 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>달력 보기</h2>
        <div className="btn-group">
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => isMobile ? handleWeekChange('prev') : handleMonthChange('prev')}
            disabled={isMobile && currentWeek === 0}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="btn btn-outline-secondary" disabled>
            {isMobile 
              ? getWeekRange()
              : new Date(currentMonth + '-01').toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long' 
                })
            }
          </button>
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => isMobile ? handleWeekChange('next') : handleMonthChange('next')}
            disabled={isMobile && currentWeek === maxWeek}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {/* 요일 헤더 */}
          <div className="calendar-header">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="calendar-grid">
            {/* PC: 월 전체(6주) */}
            {!isMobile && calendarData.length > 0 && (
              <>
                {calendarData.map((week, weekIndex) => (
                  <div key={weekIndex} className="calendar-week">
                    {week.map((dateData, dayIndex) => (
                      <div 
                        key={dayIndex}
                        className={getDayClass(dateData)}
                        style={getDayStyle(dateData)}
                        onClick={() => handleDateClick(dateData)}
                      >
                        <div className="calendar-date">
                          {dateData.date.getDate()}
                        </div>
                        {dateData.transactions.length > 0 && (
                          <div className="calendar-summary">
                            <div className="income-amount">
                              {dateData.totalIncome > 0 && (
                                <span title={formatAmount(dateData.totalIncome)}>
                                  +{formatAmount(dateData.totalIncome)}
                                </span>
                              )}
                            </div>
                            <div className="expense-amount">
                              {dateData.totalExpense > 0 && (
                                <span title={formatAmount(dateData.totalExpense)}>
                                  -{formatAmount(dateData.totalExpense)}
                                </span>
                              )}
                            </div>
                            <div className="transaction-count">
                              {dateData.transactions.length}건
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            {/* 모바일: 선택한 주만 */}
            {isMobile && calendarData.length > 0 && (
              <div className="calendar-week">
                {calendarData[currentWeek].map((dateData, dayIndex) => (
                  <div 
                    key={dayIndex}
                    className={getDayClass(dateData)}
                    style={getDayStyle(dateData)}
                    onClick={() => handleDateClick(dateData)}
                  >
                    <div className="calendar-date">
                      {dateData.date.getDate()}
                    </div>
                    {dateData.transactions.length > 0 && (
                      <div className="calendar-summary">
                        <div className="income-amount">
                          {dateData.totalIncome > 0 && (
                            <span title={formatAmount(dateData.totalIncome)}>
                              +{formatAmountMobile(dateData.totalIncome)}
                            </span>
                          )}
                        </div>
                        <div className="expense-amount">
                          {dateData.totalExpense > 0 && (
                            <span title={formatAmount(dateData.totalExpense)}>
                              -{formatAmountMobile(dateData.totalExpense)}
                            </span>
                          )}
                        </div>
                        <div className="transaction-count">
                          {dateData.transactions.length}건
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 거래 추가 모달 */}
      <TransactionModal 
        show={showTransactionModal}
        onHide={() => {
          setShowTransactionModal(false);
          setSelectedDate(null);
        }}
        onSubmit={handleTransactionSubmit}
        title="거래 추가"
        initialDate={selectedDate}
        categories={categories}
      />

      {/* 범례 */}
      <div className="mt-3">
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6>달력 범례</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <div 
                    className="legend-item me-3" 
                    style={{ backgroundColor: 'rgba(40, 167, 69, 0.3)' }}
                  ></div>
                  <span>수입이 많은 날</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div 
                    className="legend-item me-3" 
                    style={{ backgroundColor: 'rgba(220, 53, 69, 0.3)' }}
                  ></div>
                  <span>지출이 많은 날</span>
                </div>
                <div className="d-flex align-items-center">
                  <div className="legend-item me-3" style={{ backgroundColor: '#f8f9fa' }}></div>
                  <span>거래가 없는 날</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6>사용법</h6>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li><i className="fas fa-mouse-pointer me-2"></i>날짜를 클릭하여 거래 추가</li>
                  <li><i className="fas fa-chart-line me-2"></i>색상 강도는 거래 금액에 비례</li>
                  <li><i className="fas fa-calendar-alt me-2"></i>월/주 이동 버튼으로 다른 기간 확인</li>
                  {isMobile && (
                    <li><i className="fas fa-mobile-alt me-2"></i>모바일에서는 주 단위로 표시</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 