const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '../data/budget.db');

// data 디렉토리가 없으면 생성
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
        process.exit(1);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        initDatabase();
    }
});

// 데이터베이스 초기화
function initDatabase() {
    // 사용자 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('사용자 테이블 생성 오류:', err.message);
        } else {
            console.log('사용자 테이블이 생성되었습니다.');
        }
    });

    // 카테고리 테이블 생성 (user_id 추가)
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        color TEXT DEFAULT '#007bff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('카테고리 테이블 생성 오류:', err.message);
        } else {
            console.log('카테고리 테이블이 생성되었습니다.');
        }
    });

    // 거래 내역 테이블 생성 (user_id 추가)
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category_id INTEGER,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
        date DATE NOT NULL,
        account TEXT,
        card TEXT,
        memo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`, (err) => {
        if (err) {
            console.error('거래 내역 테이블 생성 오류:', err.message);
        } else {
            console.log('거래 내역 테이블이 생성되었습니다.');
        }
    });

    // 마이그레이션: 기존 테이블에 필드가 없으면 추가
    db.all("PRAGMA table_info(transactions)", (err, columns) => {
        if (!err && Array.isArray(columns) && columns.length > 0) {
            const colNames = columns.map(col => col.name);
            if (!colNames.includes('account')) {
                db.run('ALTER TABLE transactions ADD COLUMN account TEXT');
            }
            if (!colNames.includes('card')) {
                db.run('ALTER TABLE transactions ADD COLUMN card TEXT');
            }
            if (!colNames.includes('memo')) {
                db.run('ALTER TABLE transactions ADD COLUMN memo TEXT');
            }
            // type 필드의 CHECK 제약조건은 SQLite에서 ALTER로 변경 불가, 신규 DB에만 반영됨
        } else {
            console.error('PRAGMA table_info(transactions) 결과가 비정상입니다:', columns);
        }
    });

    // 초기 자본금 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS initial_balance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('초기 자본금 테이블 생성 오류:', err.message);
        } else {
            console.log('초기 자본금 테이블이 생성되었습니다.');
            insertDefaultCategories();
        }
    });
}

// 기본 카테고리 추가
function insertDefaultCategories() {
    const defaultCategories = [
        { name: '급여', type: 'income', color: '#28a745' },
        { name: '용돈', type: 'income', color: '#17a2b8' },
        { name: '식비', type: 'expense', color: '#dc3545' },
        { name: '교통비', type: 'expense', color: '#fd7e14' },
        { name: '쇼핑', type: 'expense', color: '#e83e8c' },
        { name: '문화생활', type: 'expense', color: '#6f42c1' },
        { name: '의료비', type: 'expense', color: '#20c997' },
        { name: '기타', type: 'expense', color: '#6c757d' }
    ];

    // 기존 카테고리 수 확인
    db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (err) {
            console.error('카테고리 수 확인 오류:', err.message);
        } else if (row.count === 0) {
            // 기본 카테고리가 없으면 추가
            defaultCategories.forEach(category => {
                db.run(`INSERT INTO categories (name, type, color) VALUES (?, ?, ?)`,
                    [category.name, category.type, category.color],
                    function(err) {
                        if (err) {
                            console.error('기본 카테고리 추가 오류:', err.message);
                        }
                    });
            });
            console.log('기본 카테고리가 추가되었습니다.');
        }
    });
}

// 데이터베이스 연결 종료 처리
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('데이터베이스 연결 종료 오류:', err.message);
        } else {
            console.log('데이터베이스 연결이 종료되었습니다.');
        }
        process.exit(0);
    });
});

module.exports = db; 