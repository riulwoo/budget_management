const db = require('../config/database');

class Transaction {
    // 모든 거래 내역 조회 (사용자별)
    static getAll(userId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color 
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
            `;
            let params = [];
            
            if (userId) {
                query += ' WHERE t.user_id = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 월별 거래 내역 조회 (사용자별)
    static getByMonth(year, month, userId = null) {
        return new Promise((resolve, reject) => {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color 
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
                WHERE t.date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            
            if (userId) {
                query += ' AND t.user_id = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 거래 내역 추가
    static create(transactionData) {
        return new Promise((resolve, reject) => {
            const { amount, description, category_id, type, date, user_id, account, card, memo } = transactionData;
            db.run('INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [amount, description, category_id, type, date, user_id, account || null, card || null, memo || null],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...transactionData });
                    }
                });
        });
    }

    // 거래 내역 수정
    static update(id, transactionData, userId = null) {
        return new Promise((resolve, reject) => {
            const { amount, description, category_id, type, date, account, card, memo } = transactionData;
            let query = 'UPDATE transactions SET amount = ?, description = ?, category_id = ?, type = ?, date = ?, account = ?, card = ?, memo = ? WHERE id = ?';
            let params = [amount, description, category_id, type, date, account || null, card || null, memo || null, id];
            
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            
            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, ...transactionData });
                }
            });
        });
    }

    // 거래 내역 삭제
    static delete(id, userId = null) {
        return new Promise((resolve, reject) => {
            let query = 'DELETE FROM transactions WHERE id = ?';
            let params = [id];
            
            if (userId) {
                query += ' AND user_id = ?';
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

    // 월별 통계 조회 (사용자별)
    static getMonthlyStats(year, month, userId = null) {
        return new Promise((resolve, reject) => {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            
            let query = `
                SELECT 
                    type,
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM transactions 
                WHERE date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            
            query += ' GROUP BY type';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const stats = {
                        income: { total: 0, count: 0 },
                        expense: { total: 0, count: 0 }
                    };
                    
                    rows.forEach(row => {
                        stats[row.type] = {
                            total: parseFloat(row.total_amount),
                            count: row.count
                        };
                    });
                    
                    resolve(stats);
                }
            });
        });
    }

    // 카테고리별 통계 조회 (사용자별)
    static getCategoryStats(year, month, userId = null) {
        return new Promise((resolve, reject) => {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            
            let query = `
                SELECT 
                    c.name as category_name,
                    c.color as category_color,
                    t.type,
                    SUM(t.amount) as total_amount,
                    COUNT(*) as count
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            
            if (userId) {
                query += ' AND t.user_id = ?';
                params.push(userId);
            }
            
            query += ' GROUP BY c.id, t.type ORDER BY t.type, total_amount DESC';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 거래 내역 소유권 확인
    static isOwner(transactionId, userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT user_id FROM transactions WHERE id = ?', [transactionId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row && row.user_id === userId);
                }
            });
        });
    }
}

module.exports = Transaction; 