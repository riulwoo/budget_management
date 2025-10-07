const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// BigInt 직렬화 문제 해결
BigInt.prototype.toJSON = function() { 
    return this.toString(); 
};

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 데이터베이스 풀 가져오기
const pool = require('./config/database');

// API 라우트
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// 데이터베이스 연결 상태 모니터링 엔드포인트
app.get('/api/db-status', (req, res) => {
    try {
        const stats = {
            activeConnections: pool.activeConnections(),
            totalConnections: pool.totalConnections(),
            idleConnections: pool.idleConnections(),
            taskQueueSize: pool.taskQueueSize()
        };
        res.json({
            success: true,
            message: 'Database pool status',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get database status',
            error: error.message
        });
    }
});

// React 앱을 위한 라우트
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 에러 핸들러
app.use((req, res) => {
    res.status(404).json({ success: false, message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
});