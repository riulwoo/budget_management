const { pool, getUtf8Connection } = require('../config/database');
const crypto = require('crypto');

class User {
    // BigIntÎ•?Î¨∏Ïûê?¥Î°ú Î≥Ä?òÌïò???†Ìã∏Î¶¨Ìã∞ Î©îÏÑú??
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
    // ?¨Ïö©???ùÏÑ±
    static async create(userData) {
        const { username, email, password } = userData;
        
        // ?ÖÎ†• Í≤ÄÏ¶?
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        
        try {
            // ?∞Í≤∞ ?Ä?ÑÏïÑ???§Ï†ïÍ≥??®Íªò ?∞Í≤∞ ?çÎìù
            conn = await Promise.race([
                getUtf8Connection(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Connection timeout')), 15000)
                )
            ]);

            // Ï§ëÎ≥µ ?ïÏù∏???ÑÌïú ?∏Îûú??Öò ?úÏûë
            await conn.beginTransaction();
            
            // Ï§ëÎ≥µ ?ïÏù∏
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
            
            // BigIntÎ•?Î¨∏Ïûê?¥Î°ú Î≥Ä??
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
            
            // ?∞Í≤∞ Í¥Ä???§Î•ò Î©îÏãúÏßÄ Í∞úÏÑ†
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

    // ?¨Ïö©??Ï°∞Ìöå (Î°úÍ∑∏?∏Ïö©)
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

    // ?¨Ïö©??Ï°∞Ìöå (IDÎ°?
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

    // ?¥Î©î??Ï§ëÎ≥µ ?ïÏù∏
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

    // ÎπÑÎ?Î≤àÌò∏ Í≤ÄÏ¶?
    static verifyPassword(password, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }

    // ÎπÑÎ?Î≤àÌò∏ Î≥ÄÍ≤?
    static async updatePassword(userId, newPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        let conn;
        try {
            conn = await getUtf8Connection();
            const result = await conn.query('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [hash, salt, userId]);
            
            // BigIntÎ•?Î¨∏Ïûê?¥Î°ú Î≥Ä??
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
