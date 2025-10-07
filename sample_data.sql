-- 개발용 초기 데이터 삽입
-- Budget Management System
-- 테스트 및 개발 목적

USE budget_management;

-- 테스트 사용자 생성
INSERT INTO users (username, email, password_hash, salt) VALUES
('admin', 'admin@budget.com', 'hashed_password_1', 'salt1'),
('testuser', 'test@budget.com', 'hashed_password_2', 'salt2'),
('demo', 'demo@budget.com', 'hashed_password_3', 'salt3');

-- 사용자별 추가 카테고리 생성
INSERT INTO categories (name, type, color, user_id, parent_id) VALUES
-- admin 사용자의 추가 카테고리
('프리랜싱', 'income', '#4CAF50', 1, NULL),
('용돈', 'income', '#8BC34A', 1, NULL),
('외식비', 'expense', '#F44336', 1, 5),  -- 식비 하위
('마트', 'expense', '#FF5722', 1, 5),     -- 식비 하위
('지하철', 'expense', '#2196F3', 1, 6),   -- 교통비 하위
('택시', 'expense', '#03A9F4', 1, 6),     -- 교통비 하위

-- testuser 사용자의 추가 카테고리
('아르바이트', 'income', '#4CAF50', 2, NULL),
('배달비', 'expense', '#F44336', 2, NULL),
('구독료', 'expense', '#9C27B0', 2, NULL);

-- 초기 잔액 설정
INSERT INTO initial_balance (user_id, amount) VALUES
(1, 1000000.00),  -- admin: 100만원
(2, 500000.00),   -- testuser: 50만원
(3, 100000.00);   -- demo: 10만원

-- 샘플 거래 데이터 (최근 3개월)
INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo) VALUES
-- admin 사용자 거래 (10월)
(3000000.00, '월급', 1, 'income', '2024-10-01', 1, '우리은행', NULL, '10월 급여'),
(50000.00, '프리랜싱 수입', 15, 'income', '2024-10-05', 1, '국민은행', NULL, '웹사이트 제작'),
(25000.00, '점심 외식', 17, 'expense', '2024-10-07', 1, NULL, '삼성카드', '동료들과 식사'),
(120000.00, '마트 장보기', 18, 'expense', '2024-10-07', 1, NULL, '현대카드', '주간 장보기'),
(1200.00, '지하철', 19, 'expense', '2024-10-07', 1, NULL, '교통카드', '출퇴근'),

-- admin 사용자 거래 (9월)
(3000000.00, '월급', 1, 'income', '2024-09-01', 1, '우리은행', NULL, '9월 급여'),
(80000.00, '프리랜싱 수입', 15, 'income', '2024-09-15', 1, '국민은행', NULL, '로고 디자인'),
(450000.00, '월세', 7, 'expense', '2024-09-01', 1, '우리은행', NULL, '9월 월세'),
(55000.00, '통신비', 8, 'expense', '2024-09-02', 1, '우리은행', NULL, '휴대폰+인터넷'),
(150000.00, '마트 장보기', 18, 'expense', '2024-09-10', 1, NULL, '현대카드', '월간 대형 장보기'),
(35000.00, '외식', 17, 'expense', '2024-09-12', 1, NULL, '삼성카드', '가족 식사'),
(20000.00, '택시', 20, 'expense', '2024-09-15', 1, NULL, '카카오페이', '늦은 퇴근'),
(80000.00, '영화관람', 11, 'expense', '2024-09-20', 1, NULL, '삼성카드', '가족 영화관람'),

-- testuser 사용자 거래
(800000.00, '아르바이트', 21, 'income', '2024-10-01', 2, '신한은행', NULL, '카페 알바'),
(12000.00, '배달비', 22, 'expense', '2024-10-02', 2, NULL, '배민페이', '치킨 주문'),
(9900.00, '구독료', 23, 'expense', '2024-10-01', 2, '신한은행', NULL, '넷플릭스'),
(15000.00, '점심', 5, 'expense', '2024-10-05', 2, NULL, '체크카드', '학교 근처 식당'),
(2500.00, '버스', 6, 'expense', '2024-10-07', 2, NULL, '교통카드', '통학'),

-- demo 사용자 거래
(50000.00, '용돈', 4, 'income', '2024-10-01', 3, NULL, NULL, '부모님 용돈'),
(8000.00, '간식', 5, 'expense', '2024-10-02', 3, NULL, '현금', '편의점'),
(3000.00, '문구용품', 12, 'expense', '2024-10-03', 3, NULL, '현금', '필기구 구매'),
(15000.00, '게임 아이템', 11, 'expense', '2024-10-05', 3, NULL, '카카오페이', '모바일 게임');

-- 추가 월별 데이터 (8월)
INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo) VALUES
-- admin 8월 데이터
(3000000.00, '월급', 1, 'income', '2024-08-01', 1, '우리은행', NULL, '8월 급여'),
(450000.00, '월세', 7, 'expense', '2024-08-01', 1, '우리은행', NULL, '8월 월세'),
(55000.00, '통신비', 8, 'expense', '2024-08-02', 1, '우리은행', NULL, '휴대폰+인터넷'),
(200000.00, '여행', 13, 'expense', '2024-08-15', 1, NULL, '삼성카드', '부산 여행'),
(80000.00, '쇼핑', 12, 'expense', '2024-08-20', 1, NULL, '현대카드', '여름 옷 구매'),

-- testuser 8월 데이터
(750000.00, '아르바이트', 21, 'income', '2024-08-01', 2, '신한은행', NULL, '카페 알바'),
(9900.00, '구독료', 23, 'expense', '2024-08-01', 2, '신한은행', NULL, '넷플릭스'),
(30000.00, '교재비', 10, 'expense', '2024-08-10', 2, NULL, '체크카드', '전공서적');

-- 데이터 삽입 확인
SELECT 'Sample data inserted successfully!' as result;
SELECT 'Total users:' as info, COUNT(*) as count FROM users;
SELECT 'Total categories:' as info, COUNT(*) as count FROM categories;
SELECT 'Total transactions:' as info, COUNT(*) as count FROM transactions;
SELECT 'Total initial balances:' as info, COUNT(*) as count FROM initial_balance;

-- 사용자별 현재 잔액 확인
SELECT 
    u.username,
    COALESCE(ib.amount, 0) as initial_balance,
    COALESCE(income.total, 0) as total_income,
    COALESCE(expense.total, 0) as total_expense,
    (COALESCE(ib.amount, 0) + COALESCE(income.total, 0) - COALESCE(expense.total, 0)) as current_balance
FROM users u
LEFT JOIN initial_balance ib ON u.id = ib.user_id
LEFT JOIN (
    SELECT user_id, SUM(amount) as total 
    FROM transactions 
    WHERE type = 'income' 
    GROUP BY user_id
) income ON u.id = income.user_id
LEFT JOIN (
    SELECT user_id, SUM(amount) as total 
    FROM transactions 
    WHERE type = 'expense' 
    GROUP BY user_id
) expense ON u.id = expense.user_id;