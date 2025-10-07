const pool = require('../config/database');

class Transaction {
    // 모든 거래 내역 조회 (사용자별)
    static async getAll(userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
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
            const rows = await conn.query(query, params);
            return rows;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 월별 거래 내역 조회 (사용자별)
    static async getByMonth(year, month, userId = null) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        let conn;
        try {
            conn = await pool.getConnection();
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
            const rows = await conn.query(query, params);
            return rows;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 거래 내역 추가
    static async create(transactionData) {
        const { amount, description, category_id, type, date, user_id, account, card, memo } = transactionData;
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [amount, description, category_id, type, date, user_id, account || null, card || null, memo || null]
            );
            return { id: result.insertId, ...transactionData };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 거래 내역 수정
    static async update(id, transactionData, userId = null) {
        const { amount, description, category_id, type, date, account, card, memo } = transactionData;
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'UPDATE transactions SET amount = ?, description = ?, category_id = ?, type = ?, date = ?, account = ?, card = ?, memo = ? WHERE id = ?';
            let params = [amount, description, category_id, type, date, account || null, card || null, memo || null, id];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            return { id, ...transactionData };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 거래 내역 삭제 (async/await + pool)
    static async delete(id, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'DELETE FROM transactions WHERE id = ?';
            let params = [id];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            // result.affectedRows: 삭제된 행 수 (MariaDB)
            return { deletedRows: result.affectedRows };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 월별 통계 조회 (사용자별, async/await + pool)
    static async getMonthlyStats(year, month, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
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
            const rows = await conn.query(query, params);
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
            return stats;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리별 통계 조회 (사용자별, async/await + pool)
    static async getCategoryStats(year, month, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
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
            const rows = await conn.query(query, params);
            return rows;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 거래 내역 소유권 확인 (async/await + pool)
    static async isOwner(transactionId, userId) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT user_id FROM transactions WHERE id = ?', [transactionId]);
            const row = rows[0];
            return row && row.user_id === userId;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Transaction; 