# Budget Management System - Database Setup

## 개요

Budget Management System의 데이터베이스 스키마와 설치 스크립트입니다. MariaDB/MySQL을 기반으로 한 완전한 가계부 관리 시스템의 데이터베이스 구조를 제공합니다.

## 데이터베이스 구조

### 1. 테이블 구조

#### `users` - 사용자 테이블
- `id`: 사용자 고유 ID (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- `username`: 사용자명 (VARCHAR(50), UNIQUE, NOT NULL)
- `email`: 이메일 (VARCHAR(100), UNIQUE, NOT NULL)
- `password_hash`: 암호화된 비밀번호 (VARCHAR(128), NOT NULL)
- `salt`: 암호화 솔트 (VARCHAR(32), NOT NULL)
- `created_at`: 생성일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

#### `categories` - 카테고리 테이블 (계층형 구조)
- `id`: 카테고리 고유 ID (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- `name`: 카테고리명 (VARCHAR(100), NOT NULL)
- `type`: 카테고리 유형 (ENUM: 'income', 'expense', NOT NULL)
- `color`: 표시 색상 (VARCHAR(7), DEFAULT '#000000')
- `user_id`: 소유 사용자 ID (BIGINT, NULL - NULL일 경우 시스템 기본 카테고리)
- `parent_id`: 부모 카테고리 ID (BIGINT, NULL - 계층형 구조 지원)
- `created_at`: 생성일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at`: 수정일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `transactions` - 거래 내역 테이블
- `id`: 거래 고유 ID (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- `amount`: 금액 (DECIMAL(15,2), NOT NULL)
- `description`: 거래 설명 (VARCHAR(255), NOT NULL)
- `category_id`: 카테고리 ID (BIGINT, NOT NULL, FOREIGN KEY)
- `type`: 거래 유형 (ENUM: 'income', 'expense', NOT NULL)
- `date`: 거래 날짜 (DATE, NOT NULL)
- `user_id`: 사용자 ID (BIGINT, NOT NULL, FOREIGN KEY)
- `account`: 계좌 정보 (VARCHAR(100), NULL)
- `card`: 카드 정보 (VARCHAR(100), NULL)
- `memo`: 메모 (TEXT, NULL)
- `created_at`: 생성일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at`: 수정일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `initial_balance` - 초기 잔액 테이블
- `id`: 고유 ID (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id`: 사용자 ID (BIGINT, NOT NULL, UNIQUE, FOREIGN KEY)
- `amount`: 초기 잔액 (DECIMAL(15,2), NOT NULL, DEFAULT 0.00)
- `created_at`: 생성일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at`: 수정일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `audit_log` - 감사 로그 테이블
- `id`: 로그 고유 ID (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- `table_name`: 테이블명 (VARCHAR(50), NOT NULL)
- `operation`: 작업 유형 (ENUM: 'INSERT', 'UPDATE', 'DELETE', NOT NULL)
- `record_id`: 대상 레코드 ID (BIGINT, NOT NULL)
- `user_id`: 작업 수행 사용자 ID (BIGINT, NULL)
- `old_values`: 변경 전 값 (JSON, NULL)
- `new_values`: 변경 후 값 (JSON, NULL)
- `created_at`: 생성일시 (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### 2. 인덱스

성능 최적화를 위한 인덱스 구성:
- 사용자별 거래 조회: `idx_user_date`, `idx_user_type`, `idx_user_category_date`
- 카테고리별 조회: `idx_category`, `idx_parent`, `idx_type`
- 날짜별 조회: `idx_date`
- 검색 최적화: `idx_username`, `idx_email`, `idx_categories_name`

### 3. 뷰

#### `categories_with_usage` - 사용 통계 포함 카테고리 뷰
카테고리별 거래 횟수, 총 금액, 마지막 사용일을 포함한 통합 뷰

#### `monthly_stats` - 월간 통계 뷰
사용자별 월간 거래 통계 (거래 횟수, 총액, 평균액)

### 4. 저장 프로시저

#### `GetUserBalance(p_user_id)` - 사용자 잔액 조회
사용자의 초기 잔액, 총 수입, 총 지출, 현재 잔액을 계산하여 반환

### 5. 트리거

거래 테이블의 모든 변경사항을 `audit_log`에 기록:
- `tr_transactions_insert`: INSERT 작업 감사
- `tr_transactions_update`: UPDATE 작업 감사
- `tr_transactions_delete`: DELETE 작업 감사

## 설치 방법

### 1. 환경 설정

`.env` 파일에 데이터베이스 연결 정보를 설정:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=budget_management
```

### 2. Windows 환경에서 설치

```cmd
# 환경변수 설정
set DB_HOST=localhost
set DB_USER=your_username
set DB_PASSWORD=your_password

# 데이터베이스 설치 실행
setup_database.bat
```

### 3. Linux/Mac 환경에서 설치

```bash
# 환경변수 설정
export DB_HOST=localhost
export DB_USER=your_username
export DB_PASSWORD=your_password

# 실행 권한 부여 및 설치 실행
chmod +x setup_database.sh
./setup_database.sh
```

### 4. 수동 설치

```sql
-- 1. 데이터베이스 생성
mysql -u your_username -p
CREATE DATABASE budget_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 스키마 생성
USE budget_management;
SOURCE database_schema.sql;

-- 3. 샘플 데이터 삽입 (선택사항)
SOURCE sample_data.sql;
```

## 파일 구성

- `database_schema.sql`: 완전한 데이터베이스 스키마 (테이블, 인덱스, 뷰, 프로시저, 트리거)
- `migrate.sql`: 마이그레이션 스크립트 (기존 데이터베이스 재구성)
- `sample_data.sql`: 개발/테스트용 샘플 데이터
- `setup_database.bat`: Windows용 자동 설치 스크립트
- `setup_database.sh`: Linux/Mac용 자동 설치 스크립트
- `DATABASE_README.md`: 이 문서

## 기본 데이터

시스템 기본 카테고리가 자동으로 생성됩니다:

### 수입 카테고리
- 급여 (#4CAF50)
- 부업 (#8BC34A)
- 투자 (#FF9800)
- 기타수입 (#607D8B)

### 지출 카테고리
- 식비 (#F44336)
- 교통비 (#2196F3)
- 주거비 (#9C27B0)
- 통신비 (#3F51B5)
- 의료비 (#009688)
- 교육비 (#FF5722)
- 문화생활 (#E91E63)
- 쇼핑 (#795548)
- 여행 (#00BCD4)
- 기타지출 (#9E9E9E)

## 샘플 사용자 (sample_data.sql 적용 시)

테스트용 사용자 계정:
- `admin`: 관리자 계정 (초기잔액: 100만원)
- `testuser`: 일반 사용자 계정 (초기잔액: 50만원)
- `demo`: 데모 계정 (초기잔액: 10만원)

## 주의사항

1. **보안**: 프로덕션 환경에서는 강력한 암호화와 적절한 권한 설정이 필요합니다.
2. **백업**: 중요한 데이터는 정기적으로 백업해야 합니다.
3. **성능**: 대용량 데이터 처리 시 인덱스 최적화가 필요할 수 있습니다.
4. **마이그레이션**: 기존 데이터가 있는 경우 `migrate.sql` 사용 전 백업을 권장합니다.

## 트러블슈팅

### 연결 오류
- MariaDB/MySQL 서비스가 실행 중인지 확인
- 방화벽 설정 확인
- 사용자 권한 확인

### 권한 오류
```sql
GRANT ALL PRIVILEGES ON budget_management.* TO 'username'@'%';
FLUSH PRIVILEGES;
```

### 문자셋 문제
- 데이터베이스와 테이블이 `utf8mb4`로 설정되어 있는지 확인
- 클라이언트 연결 시 문자셋 지정

## 버전 정보

- 데이터베이스 스키마 버전: 1.0.0
- 지원 DB: MariaDB 10.3+, MySQL 8.0+
- 생성일: 2024년 10월