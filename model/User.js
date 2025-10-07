const { pool, getUtf8Connection } = require('../config/database');
const crypto = require('crypto');

class User {
    // BigInt�?문자?�로 변?�하???�틸리티 메서??
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
    // ?�용???�성
    static async create(userData) {
        const { username, email, password } = userData;
        
        // ?�력 검�?
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        
        try {
            // ?�결 ?�?�아???�정�??�께 ?�결 ?�득
            conn = await Promise.race([
                getUtf8Connection(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), 15000)
                )
            ]);

            // 중복 ?�인???�한 ?�랜??�� ?�작
            await conn.beginTransaction();
            
            // 중복 ?�인
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
            
            // BigInt�?문자?�로 변??
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
            
            // ?�결 관???�류 메시지 개선
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

    // ?�용??조회 (로그?�용)
    static async findByUsername(username) {
        let conn;
        try {
            conn = await getUtf8Connection();
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

    // ?�용??조회 (ID�?
    static async findById(id) {
        let conn;
        try {
            conn = await getUtf8Connection();
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

    // ?�메??중복 ?�인
    static async findByEmail(email) {
        let conn;
        try {
            conn = await getUtf8Connection();
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

    // 비�?번호 검�?
    static verifyPassword(password, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }

    // 비�?번호 변�?
    static async updatePassword(userId, newPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        try {
            conn = await getUtf8Connection();
            const result = await conn.query('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, userId]);
            
            // BigInt�?문자?�로 변??
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
