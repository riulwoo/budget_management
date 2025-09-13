const pool = require('../config/database');
const crypto = require('crypto');

class User {
    // 사용자 생성
    static async create(userData) {
        const { username, email, password } = userData;
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
                [username, email, hash, salt]
            );
            return { id: result.insertId, username, email };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 사용자 조회 (로그인용)
    static async findByUsername(username) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0] || null;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 사용자 조회 (ID로)
    static async findById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 이메일 중복 확인
    static async findByEmail(email) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
            return rows[0] || null;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 비밀번호 검증
    static verifyPassword(password, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }

    // 비밀번호 변경
    static async updatePassword(userId, newPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, userId]);
            return { updatedRows: result.affectedRows };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = User; 