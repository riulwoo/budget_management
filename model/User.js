const pool = require('../config/database');
const crypto = require('crypto');

class User {
    // BigInt를 문자열로 변환하는 유틸리티 메서드
    static convertBigIntToString(obj) {
        if (!obj) return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertBigIntToString(item));
        }
        
        if (typeof obj === 'object') {
            const converted = {};
            for (const key in obj) {
                if (typeof obj[key] === 'bigint') {
                    converted[key] = obj[key].toString();
                } else if (typeof obj[key] === 'object') {
                    converted[key] = this.convertBigIntToString(obj[key]);
                } else {
                    converted[key] = obj[key];
                }
            }
            return converted;
        }
        
        return obj;
    }
    // 사용자 생성
    static async create(userData) {
        const { username, email, password } = userData;
        
        // 입력 검증
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        
        try {
            // 연결 타임아웃 설정과 함께 연결 획득
            conn = await Promise.race([
                pool.getConnection(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), 15000)
                )
            ]);

            // 중복 확인을 위한 트랜잭션 시작
            await conn.beginTransaction();
            
            // 중복 확인
            const existingUser = await conn.query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existingUser.length > 0) {
                await conn.rollback();
                throw new Error('Username or email already exists');
            }

            const result = await conn.query(
                'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
                [username, email, hash, salt]
            );
            
            await conn.commit();
            
            // BigInt를 문자열로 변환
            const userId = typeof result.insertId === 'bigint' 
                ? result.insertId.toString() 
                : result.insertId;
                
            return { id: userId, username, email };
            
        } catch (err) {
            if (conn) {
                try {
                    await conn.rollback();
                } catch (rollbackErr) {
                    console.error('Rollback error:', rollbackErr);
                }
            }
            
            // 연결 관련 오류 메시지 개선
            if (err.message.includes('pool timeout') || err.message.includes('Connection timeout')) {
                throw new Error('Database connection timeout. Please try again.');
            } else if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Username or email already exists');
            } else {
                console.error('User creation error:', err);
                throw new Error('Failed to create user. Please try again.');
            }
        } finally {
            if (conn) {
                try {
                    conn.release();
                } catch (releaseErr) {
                    console.error('Connection release error:', releaseErr);
                }
            }
        }
    }

    // 사용자 조회 (로그인용)
    static async findByUsername(username) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
            const user = rows[0] || null;
            return user ? this.convertBigIntToString(user) : null;
        } catch (err) {
            console.error('Error finding user by username:', err);
            throw new Error('Failed to find user');
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
            const user = rows[0] || null;
            return user ? this.convertBigIntToString(user) : null;
        } catch (err) {
            console.error('Error finding user by id:', err);
            throw new Error('Failed to find user');
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
            const user = rows[0] || null;
            return user ? this.convertBigIntToString(user) : null;
        } catch (err) {
            console.error('Error finding user by email:', err);
            throw new Error('Failed to find user by email');
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
            
            // BigInt를 문자열로 변환
            const updatedRows = typeof result.affectedRows === 'bigint' 
                ? result.affectedRows.toString() 
                : result.affectedRows;
                
            return { updatedRows };
        } catch (err) {
            console.error('Error updating password:', err);
            throw new Error('Failed to update password');
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = User; 