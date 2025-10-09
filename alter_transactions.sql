-- 거래 테이블에 자산 연결 컬럼 추가
ALTER TABLE transactions ADD COLUMN asset_id BIGINT NULL AFTER user_id;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_asset 
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD INDEX idx_asset (asset_id);