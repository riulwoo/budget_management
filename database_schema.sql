-- Budget Management System Database Schema
-- MariaDB/MySQL DDL
-- Created: October 2025

-- 기존 테이블 삭제 (외래키 순서에 따라 역순으로)
DROP TABLE IF EXISTS memos;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS initial_balance;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 사용자 테이블
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 카테고리 테이블 (계층형 구조 지원)
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    user_id BIGINT NULL,
    parent_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_type (user_id, type),
    INDEX idx_parent (parent_id),
    INDEX idx_type (type)
);

-- 거래 내역 테이블
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category_id BIGINT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    date DATE NOT NULL,
    user_id BIGINT NOT NULL,
    account VARCHAR(100) NULL,
    card VARCHAR(100) NULL,
    memo TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_user_date (user_id, date),
    INDEX idx_user_type (user_id, type),
    INDEX idx_category (category_id),
    INDEX idx_date (date),
    INDEX idx_type (type)
);

-- 초기 잔액 테이블
CREATE TABLE initial_balance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (name, type, color, user_id, parent_id) VALUES
-- 수입 카테고리 (시스템 기본)
('급여', 'income', '#4CAF50', NULL, NULL),
('부업', 'income', '#8BC34A', NULL, NULL),
('투자', 'income', '#FF9800', NULL, NULL),
('기타수입', 'income', '#607D8B', NULL, NULL),

-- 지출 카테고리 (시스템 기본)
('식비', 'expense', '#F44336', NULL, NULL),
('교통비', 'expense', '#2196F3', NULL, NULL),
('주거비', 'expense', '#9C27B0', NULL, NULL),
('통신비', 'expense', '#3F51B5', NULL, NULL),
('의료비', 'expense', '#009688', NULL, NULL),
('교육비', 'expense', '#FF5722', NULL, NULL),
('문화생활', 'expense', '#E91E63', NULL, NULL),
('쇼핑', 'expense', '#795548', NULL, NULL),
('여행', 'expense', '#00BCD4', NULL, NULL),
('기타지출', 'expense', '#9E9E9E', NULL, NULL);

-- 인덱스 최적화를 위한 추가 인덱스
CREATE INDEX idx_transactions_user_category_date ON transactions(user_id, category_id, date);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_categories_name ON categories(name);

-- 뷰 생성 (사용 통계 포함 카테고리)
CREATE OR REPLACE VIEW categories_with_usage AS
SELECT 
    c.*,
    COALESCE(t.transaction_count, 0) as transaction_count,
    COALESCE(t.total_amount, 0) as total_amount,
    t.last_used
FROM categories c
LEFT JOIN (
    SELECT 
        category_id,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        MAX(date) as last_used
    FROM transactions
    GROUP BY category_id
) t ON c.id = t.category_id;

-- 사용자별 월간 통계 뷰
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
    user_id,
    YEAR(date) as year,
    MONTH(date) as month,
    type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM transactions
GROUP BY user_id, YEAR(date), MONTH(date), type;

-- 권한 및 제약조건 확인을 위한 프로시저 (선택사항)
DELIMITER //
CREATE PROCEDURE GetUserBalance(IN p_user_id BIGINT)
BEGIN
    SELECT 
        u.username,
        COALESCE(ib.amount, 0) as initial_balance,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
        COALESCE(ib.amount, 0) + 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_balance
    FROM users u
    LEFT JOIN initial_balance ib ON u.id = ib.user_id
    LEFT JOIN transactions t ON u.id = t.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.username, ib.amount;
END //
DELIMITER ;

-- 트리거 생성 (감사 로그 등)
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //
CREATE TRIGGER tr_transactions_insert 
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values)
    VALUES ('transactions', 'INSERT', NEW.id, NEW.user_id, 
            JSON_OBJECT('amount', NEW.amount, 'description', NEW.description, 
                       'category_id', NEW.category_id, 'type', NEW.type, 'date', NEW.date));
END //

CREATE TRIGGER tr_transactions_update 
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values, new_values)
    VALUES ('transactions', 'UPDATE', NEW.id, NEW.user_id,
            JSON_OBJECT('amount', OLD.amount, 'description', OLD.description, 
                       'category_id', OLD.category_id, 'type', OLD.type, 'date', OLD.date),
            JSON_OBJECT('amount', NEW.amount, 'description', NEW.description, 
                       'category_id', NEW.category_id, 'type', NEW.type, 'date', NEW.date));
END //

CREATE TRIGGER tr_transactions_delete 
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, user_id, old_values)
    VALUES ('transactions', 'DELETE', OLD.id, OLD.user_id,
            JSON_OBJECT('amount', OLD.amount, 'description', OLD.description, 
                       'category_id', OLD.category_id, 'type', OLD.type, 'date', OLD.date));
END //
DELIMITER ;

-- 메모 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    date DATE NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    visibility ENUM('private', 'public') DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_user_priority (user_id, priority),
    INDEX idx_visibility (visibility),
    INDEX idx_created_at (created_at)
);

-- 메모 샘플 데이터 (user_id = 1 가정)
INSERT INTO memos (user_id, title, content, date, priority, visibility) VALUES 
(1, '월급 입금 확인하기', '매월 25일 월급이 정상적으로 입금되었는지 확인하고 가계부에 기록', '2025-10-07', 'high', 'private'),
(1, '투자 팁 공유', '분기별 투자 성과를 분석하고 리밸런싱 필요 여부 검토\n- 주식 60%\n- 채권 30%\n- 현금 10%', '2025-10-07', 'medium', 'public'),
(1, '가계부 정리', '이번 달 지출 내역을 카테고리별로 분석하고 다음 달 예산 계획 수립', '2025-10-06', 'medium', 'private'),
(1, '보험료 납입', '자동차보험과 건강보험료 납입일 확인', '2025-10-05', 'high', 'private'),
(1, '아이디어 메모', '새로운 부업 아이디어\n- 온라인 강의 제작\n- 블로그 운영\n- 투자 관련 컨설팅', '2025-10-04', 'low', 'private');