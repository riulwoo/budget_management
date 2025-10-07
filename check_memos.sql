-- 메모 테이블 상태 확인
SHOW TABLES LIKE 'memos';

-- 메모 테이블 구조 확인
DESCRIBE memos;

-- 기존 메모 데이터 확인
SELECT COUNT(*) as memo_count FROM memos;