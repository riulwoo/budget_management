const db = require('../config/database');

class Category {
    // 모든 카테고리 조회 (사용자별)
    static getAll(userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM categories';
            let params = [];
            
            if (userId) {
                query += ' WHERE user_id = ? OR user_id IS NULL';
                params.push(userId);
            }
            
            query += ' ORDER BY type, name';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 타입별 카테고리 조회 (사용자별)
    static getByType(type, userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM categories WHERE type = ?';
            let params = [type];
            
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            
            query += ' ORDER BY name';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 카테고리 추가
    static create(categoryData) {
        return new Promise((resolve, reject) => {
            const { name, type, color, user_id } = categoryData;
            db.run('INSERT INTO categories (name, type, color, user_id) VALUES (?, ?, ?, ?)',
                [name, type, color, user_id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, name, type, color, user_id });
                    }
                });
        });
    }

    // 카테고리 수정
    static update(id, categoryData, userId = null) {
        return new Promise((resolve, reject) => {
            const { name, type, color } = categoryData;
            let query = 'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?';
            let params = [name, type, color, id];
            
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            
            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, name, type, color });
                }
            });
        });
    }

    // 카테고리 삭제
    static delete(id, userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'DELETE FROM categories WHERE id = ?';
            let params = [id];
            
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            
            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    // 카테고리 소유권 확인
    static isOwner(categoryId, userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT user_id FROM categories WHERE id = ?', [categoryId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row && (row.user_id === userId || row.user_id === null));
                }
            });
        });
    }

    // 카테고리 사용 현황 조회
    static getUsageStats(categoryId, userId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    COUNT(*) as total_count,
                    SUM(amount) as total_amount,
                    MAX(date) as last_used
                FROM transactions 
                WHERE category_id = ?
            `;
            let params = [categoryId];
            
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            
            db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        total_count: row.total_count || 0,
                        total_amount: row.total_amount || 0,
                        last_used: row.last_used
                    });
                }
            });
        });
    }

    // 카테고리별 사용 횟수 포함하여 조회
    static getAllWithUsage(userId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    c.*,
                    COALESCE(t.usage_count, 0) as usage_count
                FROM categories c
                LEFT JOIN (
                    SELECT 
                        category_id,
                        COUNT(*) as usage_count
                    FROM transactions
                    WHERE user_id = ? OR ? IS NULL
                    GROUP BY category_id
                ) t ON c.id = t.category_id
            `;
            let params = [userId, userId];
            
            if (userId) {
                query += ' WHERE c.user_id = ? OR c.user_id IS NULL';
                params.push(userId);
            }
            
            query += ' ORDER BY c.type, c.name';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = Category; 