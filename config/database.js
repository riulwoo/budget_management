require('dotenv').config();
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'budget_management',
    charset: 'utf8mb4',            // UTF-8 한글 지원
    collation: 'utf8mb4_general_ci',     // 범용 collation (가장 안전)
    connectionLimit: 5,            // 연결 수 감소 (개발환경)
    acquireTimeout: 10000,         // 연결 획득 타임아웃 10초
    timeout: 5000,                 // 쿼리 타임아웃 5초
    idleTimeout: 300000,           // 유휴 연결 타임아웃 5분 (단축)
    minimumIdle: 1,                // 최소 유지 연결 수 감소
    maxUses: 1000,                 // 연결 최대 재사용 횟수
    reconnect: true,               // 자동 재연결
    resetAfterUse: true,           // 연결 재사용 시 리셋
    leakDetectionTimeout: 10000,   // 연결 누수 감지 타임아웃 단축
    trace: process.env.NODE_ENV === 'development',  // 개발 환경에서만 추적
    logParam: process.env.NODE_ENV === 'development'  // 파라미터 로깅
});

// 연결 테스트 및 charset 강제 설정
pool.getConnection()
    .then(async conn => {
        console.log('✓ Database connection successful');
        
        // 리눅스 환경에서 charset 강제 설정
        try {
            await conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_general_ci'");
            await conn.query("SET character_set_client = utf8mb4");
            await conn.query("SET character_set_connection = utf8mb4");
            await conn.query("SET character_set_results = utf8mb4");
            await conn.query("SET collation_connection = utf8mb4_general_ci");
            console.log('✓ UTF-8 charset configured successfully');
        } catch (charsetErr) {
            console.warn('⚠ Charset configuration warning:', charsetErr.message);
        }
        
        conn.release();
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
        console.error('Please check your database configuration in .env file');
    });

// 풀 이벤트 리스너
pool.on('connection', (conn) => {
    console.log(`New connection established: ${conn.threadId}`);
    console.log(`Pool stats - Active: ${pool.activeConnections()}, Total: ${pool.totalConnections()}, Idle: ${pool.idleConnections()}`);
});

pool.on('error', (err) => {
    console.error('Pool error:', err);
});

pool.on('acquire', async (conn) => {
    console.log(`Connection acquired: ${conn.threadId}`);
    
    // 연결 획득 시마다 charset 강제 설정 (리눅스 환경 대응)
    try {
        await conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_general_ci'");
        await conn.query("SET collation_connection = utf8mb4_general_ci");
    } catch (err) {
        console.warn('Charset setting warning on connection acquire:', err.message);
    }
});

pool.on('release', (conn) => {
    console.log(`Connection released: ${conn.threadId}`);
});

// UTF-8 안전 연결 헬퍼 함수
const getUtf8Connection = async () => {
    const conn = await pool.getConnection();
    try {
        await conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_general_ci'");
        await conn.query("SET character_set_client = utf8mb4");
        await conn.query("SET character_set_connection = utf8mb4");  
        await conn.query("SET character_set_results = utf8mb4");
        await conn.query("SET collation_connection = utf8mb4_general_ci");
        return conn;
    } catch (err) {
        conn.release();
        throw err;
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database pool...');
    await pool.end();
    process.exit(0);
});

module.exports = { pool, getUtf8Connection };