require('dotenv').config();
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'budget_management',
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

// 연결 테스트 및 오류 처리
pool.getConnection()
    .then(conn => {
        console.log('✓ Database connection successful');
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

pool.on('acquire', (conn) => {
    console.log(`Connection acquired: ${conn.threadId}`);
});

pool.on('release', (conn) => {
    console.log(`Connection released: ${conn.threadId}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database pool...');
    await pool.end();
    process.exit(0);
});

module.exports = pool;