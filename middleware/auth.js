const jwt = require('jsonwebtoken');
const User = require('../model/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT 토큰 생성
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// JWT 토큰 검증
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 인증 미들웨어
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: '액세스 토큰이 필요합니다.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }

    req.user = decoded;
    next();
}

// 선택적 인증 미들웨어 (로그인하지 않아도 접근 가능하지만, 로그인하면 사용자 정보 제공)
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth
}; 