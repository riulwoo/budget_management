import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TransactionModal from '../components/modals/TransactionModal';
import { formatAmount, formatDate } from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';

const Calendar = () => {
  const { currentUser } = useAuth();
  const { 
    transactions, 
    categories, 
    currentMonth, 
    setCurrentMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loading 
  } = useData();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateData, setSelectedDateData] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  // 초기 로드 시 현재 월로 이동
  useEffect(() => {
    if (initialLoad) {
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      // 현재 월이 아닌 경우에만 변경
      if (currentMonth !== currentMonthStr) {
        console.log('📅 달력 페이지 초기 로드 - 현재 월로 이동:', currentMonthStr);
        setCurrentMonth(currentMonthStr);
      }
      setInitialLoad(false);
    }
  }, [initialLoad, currentMonth, setCurrentMonth]);

  // 달력 데이터 생성
  useEffect(() => {
    if (!currentMonth) {
      return;
    }
    
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
        // 로컬 날짜 문자열 생성 (시간대 문제 해결)
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        const dayTransactions = transactions.filter(t => t.date === dateStr);
        
        // 오늘 날짜 확인
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        
        weekData.push({
          date: new Date(currentDate),
          dateStr,
          isCurrentMonth: currentDate.getMonth() === month - 1,
          isToday,
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
    
    setCalendarData(calendar);
    
    // 월이 변경되면 선택된 날짜 초기화 (현재 월이 아닌 경우)
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    if (currentMonth !== currentMonthStr && selectedDate) {
      console.log('📅 다른 월로 이동 - 선택된 날짜 초기화');
      setSelectedDate(null);
      setSelectedDateData(null);
    }
  }, [currentMonth, transactions]);

  // 오늘 날짜 자동 선택 (달력 데이터가 생성된 후)
  useEffect(() => {
    if (calendarData.length === 0) return;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // 현재 월을 보고 있고, 선택된 날짜가 없는 경우에만 오늘 날짜 자동 선택
    if (!selectedDate && currentMonth === currentMonthStr) {
      // 현재 달력에서 오늘 날짜 찾기
      const todayData = calendarData.flat().find(dayData => 
        dayData.dateStr === todayStr && dayData.isCurrentMonth
      );
      
      if (todayData) {
        console.log('🗓️ 오늘 날짜 자동 선택:', todayStr);
        setSelectedDate(todayStr);
        setSelectedDateData(todayData);
        
        // 모바일에서 오늘 날짜가 포함된 주로 이동
        if (isMobile) {
          const todayWeekIndex = calendarData.findIndex(week => 
            week.some(day => day.dateStr === todayStr && day.isCurrentMonth)
          );
          if (todayWeekIndex !== -1) {
            setCurrentWeek(todayWeekIndex);
            console.log('📱 모바일 - 오늘 날짜 주로 이동:', todayWeekIndex);
          }
        }
      }
    }
  }, [calendarData, selectedDate, isMobile, currentMonth]);

  const handleDateClick = (dateData) => {
    if (dateData.isCurrentMonth) {
      setSelectedDate(dateData.dateStr);
      setSelectedDateData(dateData);
      // 모달은 바로 열지 않고, 아래 영역에 거래 내역 표시
    }
  };

  const handleTransactionSubmit = async (transactionData) => {
    let result;
    if (editingTransaction) {
      // 수정 모드
      result = await updateTransaction(editingTransaction.id, {
        ...transactionData,
        date: selectedDate
      });
    } else {
      // 추가 모드
      result = await addTransaction({
        ...transactionData,
        date: selectedDate
      });
    }
    
    if (result.success) {
      setShowTransactionModal(false);
      setEditingTransaction(null);
      // 선택된 날짜 데이터 새로고침
      if (selectedDate) {
        const updatedDateData = calendarData.flat().find(d => d.dateStr === selectedDate);
        if (updatedDateData) {
          setSelectedDateData(updatedDateData);
        }
      }
    }
    return result;
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('정말로 이 거래를 삭제하시겠습니까?')) {
      try {
        const result = await deleteTransaction(transactionId);
        
        if (result.success) {
          // 선택된 날짜 데이터에서 해당 거래 제거
          if (selectedDateData && selectedDate) {
            const updatedTransactions = selectedDateData.transactions.filter(t => t.id !== transactionId);
            const updatedTotalIncome = updatedTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const updatedTotalExpense = updatedTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            setSelectedDateData({
              ...selectedDateData,
              transactions: updatedTransactions,
              totalIncome: updatedTotalIncome,
              totalExpense: updatedTotalExpense
            });
          }
        } else {
          alert('거래 삭제에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
        }
      } catch (error) {
        alert('거래 삭제 중 오류가 발생했습니다.');
      }
    }
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
    if (dateData.isToday) {
      classes += ' today';
    }
    if (dateData.transactions.length > 0) {
      classes += ' has-transactions';
    }
    if (selectedDate === dateData.dateStr) {
      classes += ' selected';
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <div className="card">
          <div className="card-body">
            <h3>로그인이 필요합니다</h3>
            <p>달력 보기를 위해 로그인해주세요.</p>
            <i className="fas fa-calendar-alt fa-3x text-muted"></i>
          </div>
        </div>
      </div>
    );
  }

  // 월별 총합 계산
  const getMonthlyTotals = () => {
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const netAmount = monthlyIncome - monthlyExpense;
    
    return { monthlyIncome, monthlyExpense, netAmount };
  };

  const { monthlyIncome, monthlyExpense, netAmount } = getMonthlyTotals();

  return (
    <div className="calendar-page">
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

      {/* 월별 요약 */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card monthly-summary-card income-card">
            <div className="card-body text-center">
              <i className="fas fa-arrow-up fa-2x mb-2"></i>
              <div className="monthly-amount">{formatAmount(monthlyIncome)}</div>
              <div className="monthly-label">총 수입</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card monthly-summary-card expense-card">
            <div className="card-body text-center">
              <i className="fas fa-arrow-down fa-2x mb-2"></i>
              <div className="monthly-amount">{formatAmount(monthlyExpense)}</div>
              <div className="monthly-label">총 지출</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className={`card monthly-summary-card ${netAmount >= 0 ? 'net-positive-card' : 'net-negative-card'}`}>
            <div className="card-body text-center">
              <i className={`fas ${netAmount >= 0 ? 'fa-plus' : 'fa-minus'} fa-2x mb-2`}></i>
              <div className="monthly-amount">{formatAmount(Math.abs(netAmount))}</div>
              <div className="monthly-label">순 {netAmount >= 0 ? '수입' : '지출'}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card monthly-summary-card transactions-card">
            <div className="card-body text-center">
              <i className="fas fa-receipt fa-2x mb-2"></i>
              <div className="monthly-amount">{transactions.length}</div>
              <div className="monthly-label">총 거래</div>
            </div>
          </div>
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
                            {dateData.totalIncome > 0 && (
                              <div className="income-amount" title={`수입: ${formatAmount(dateData.totalIncome)}`}>
                                <i className="fas fa-plus-circle me-1"></i>
                                {formatAmount(dateData.totalIncome)}
                              </div>
                            )}
                            {dateData.totalExpense > 0 && (
                              <div className="expense-amount" title={`지출: ${formatAmount(dateData.totalExpense)}`}>
                                <i className="fas fa-minus-circle me-1"></i>
                                {formatAmount(dateData.totalExpense)}
                              </div>
                            )}
                            <div className="transaction-count">
                              <i className="fas fa-receipt me-1"></i>
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
                        {dateData.totalIncome > 0 && (
                          <div className="income-amount" title={`수입: ${formatAmount(dateData.totalIncome)}`}>
                            <i className="fas fa-plus-circle me-1"></i>
                            {formatAmountMobile(dateData.totalIncome)}
                          </div>
                        )}
                        {dateData.totalExpense > 0 && (
                          <div className="expense-amount" title={`지출: ${formatAmount(dateData.totalExpense)}`}>
                            <i className="fas fa-minus-circle me-1"></i>
                            {formatAmountMobile(dateData.totalExpense)}
                          </div>
                        )}
                        <div className="transaction-count">
                          <i className="fas fa-receipt me-1"></i>
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

      {/* 선택된 날짜의 거래 내역 */}
      {selectedDateData && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-start flex-wrap">
                <div className="selected-date-title flex-grow-1">
                  <h5 className="mb-1">
                    <i className="fas fa-calendar-day me-2"></i>
                    <span className="d-none d-md-inline">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })} 거래 내역
                    </span>
                    <span className="d-md-none">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })} 거래
                    </span>
                  </h5>
                </div>
                <div className="selected-date-actions">
                  <button 
                    className="btn btn-primary btn-sm me-2"
                    onClick={handleAddTransaction}
                  >
                    <i className="fas fa-plus d-md-none"></i>
                    <span className="d-none d-md-inline">
                      <i className="fas fa-plus me-1"></i>거래 추가
                    </span>
                    <span className="d-md-none ms-1">추가</span>
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedDateData(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {selectedDateData.transactions.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-receipt fa-2x mb-3 d-block"></i>
                  <p className="mb-3">이 날짜에는 거래 내역이 없습니다.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddTransaction}
                  >
                    <i className="fas fa-plus me-2"></i>첫 거래 추가하기
                  </button>
                </div>
              ) : (
                <>
                  {/* 일일 요약 */}
                  <div className="row mb-3">
                    <div className="col-4 mb-2">
                      <div className="card bg-success text-white daily-summary-card">
                        <div className="card-body text-center p-2">
                          <div className="daily-amount">{formatAmount(selectedDateData.totalIncome)}</div>
                          <div className="daily-label">수입</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-4 mb-2">
                      <div className="card bg-danger text-white daily-summary-card">
                        <div className="card-body text-center p-2">
                          <div className="daily-amount">{formatAmount(selectedDateData.totalExpense)}</div>
                          <div className="daily-label">지출</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-4 mb-2">
                      <div className={`card ${selectedDateData.totalIncome - selectedDateData.totalExpense >= 0 ? 'bg-info' : 'bg-warning'} text-white daily-summary-card`}>
                        <div className="card-body text-center p-2">
                          <div className="daily-amount">{formatAmount(Math.abs(selectedDateData.totalIncome - selectedDateData.totalExpense))}</div>
                          <div className="daily-label">순액</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 거래 목록 */}
                  <div className="transaction-list">
                    {selectedDateData.transactions.map(transaction => (
                      <div key={transaction.id} className="transaction-item border rounded mb-2 p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <i className={`fas ${transaction.type === 'income' ? 'fa-plus-circle text-success' : 'fa-minus-circle text-danger'} me-2`}></i>
                              <span className="fw-bold">{transaction.description || '설명 없음'}</span>
                            </div>
                            {transaction.category_name && (
                              <div className="mb-1">
                                <span 
                                  className="badge category-badge" 
                                  style={{ backgroundColor: transaction.category_color || '#6c757d' }}
                                >
                                  {transaction.category_name}
                                </span>
                              </div>
                            )}
                            <div className="text-muted small">
                              <i className="fas fa-clock me-1"></i>
                              {formatDate(transaction.date)}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className={`fw-bold fs-5 ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                            </div>
                            <div className="btn-group btn-group-sm mt-1">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleEditTransaction(transaction)}
                                title="수정"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                title="삭제"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 거래 추가/수정 모달 */}
      <TransactionModal 
        show={showTransactionModal}
        onHide={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleTransactionSubmit}
        title={editingTransaction ? "거래 수정" : "거래 추가"}
        transaction={editingTransaction}
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