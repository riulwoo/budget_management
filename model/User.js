const db = require('../config/database');
const crypto = require('crypto');

class User {
    // 사용자 생성
    static create(userData) {
        return new Promise((resolve, reject) => {
            const { username, email, password } = userData;
            
            // 비밀번호 해시화
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            
            db.run('INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
                [username, email, hash, salt],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username, email });
                    }
                });
        });
    }

    // 사용자 조회 (로그인용)
    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 사용자 조회 (ID로)
    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 이메일 중복 확인
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 비밀번호 검증
    static verifyPassword(password, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }

    // 비밀번호 변경
    static updatePassword(userId, newPassword) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
            
            db.run('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?',
                [hash, salt, userId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ updatedRows: this.changes });
                    }
                });
        });
    }
}

module.exports = User; 