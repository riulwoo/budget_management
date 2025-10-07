// 페이지별 필요 데이터 분석
const PAGE_DATA_REQUIREMENTS = {
  // Dashboard: 모든 데이터 필요
  '/': {
    categories: true,
    transactions: true, // 최근 거래
    monthlyStats: true,
    totalBalance: true
  },
  
  // Transactions: 거래 관련 데이터만
  '/transactions': {
    categories: true, // 카테고리 필터용
    transactions: true,
    monthlyStats: false,
    totalBalance: false
  },
  
  // Categories: 카테고리 데이터만
  '/categories': {
    categories: true,
    transactions: false,
    monthlyStats: false,
    totalBalance: false
  },
  
  // Calendar: 거래 데이터만
  '/calendar': {
    categories: false,
    transactions: true,
    monthlyStats: false,
    totalBalance: false
  },
  
  // Memos: 메모 데이터만 (DataContext 불필요)
  '/memos': {
    categories: false,
    transactions: false,
    monthlyStats: false,
    totalBalance: false
  },
  
  // Statistics: 통계 데이터만
  '/statistics': {
    categories: true, // 카테고리별 통계용
    transactions: false,
    monthlyStats: true,
    totalBalance: true
  },
  
  // BalanceSettings: 잔액 데이터만
  '/balance-settings': {
    categories: false,
    transactions: false,
    monthlyStats: false,
    totalBalance: true
  }
};