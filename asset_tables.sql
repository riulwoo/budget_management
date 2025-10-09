-- 자산 관리를 위한 새로운 테이블 구조 (MariaDB용)
-- 기존 initial_balance 테이블 대신 assets와 asset_types 테이블 사용

-- UTF-8 charset 강제 설정 (리눅스 환경 대응)
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_general_ci';
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_general_ci;

-- 자산 유형 테이블 생성 (현금, 예금, 적금, 투자, 부동산 등)
CREATE TABLE asset_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'fas fa-wallet',
    color VARCHAR(7) DEFAULT '#000000',
    description TEXT NULL,
    user_id BIGINT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_default (is_default)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 자산 테이블 생성
CREATE TABLE assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    asset_type_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT NULL,
    user_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_user_type (user_id, asset_type_id),
    INDEX idx_active (is_active)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 기본 자산 유형 데이터 입력
INSERT INTO asset_types (name, icon, color, description, user_id, is_default) VALUES
('현금', 'fas fa-money-bill-wave', '#4CAF50', '현금 및 지갑에 있는 돈', NULL, TRUE),
('예금', 'fas fa-university', '#2196F3', '은행 예금 계좌', NULL, TRUE),
('적금', 'fas fa-piggy-bank', '#FF9800', '정기 적금 및 예금', NULL, TRUE),
('투자', 'fas fa-chart-line', '#9C27B0', '주식, 펀드, 채권 등', NULL, TRUE),
('부동산', 'fas fa-home', '#795548', '집, 땅, 상가 등', NULL, TRUE),
('기타자산', 'fas fa-box', '#607D8B', '기타 자산', NULL, TRUE);

-- 기존 initial_balance 데이터를 assets로 마이그레이션하는 뷰 생성
CREATE VIEW user_total_balance AS
SELECT 
    u.id as user_id,
    COALESCE(SUM(a.amount), 0) as initial_balance,
    COALESCE(income.total, 0) as total_income,
    COALESCE(expense.total, 0) as total_expense,
    COALESCE(SUM(a.amount), 0) + COALESCE(income.total, 0) - COALESCE(expense.total, 0) as current_balance
FROM users u
LEFT JOIN assets a ON u.id = a.user_id AND a.is_active = TRUE
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
) expense ON u.id = expense.user_id
GROUP BY u.id;