const pool = require('../config/database');

class InitialBalance {
    // 사용자의 초기 자본금 조회
    static async getByUserId(userId) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT * FROM initial_balance WHERE user_id = ?', [userId]);
            const row = rows[0] || null;
            if (row) {
                for (const key in row) {
                    if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                }
            }
            return row;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 초기 자본금 설정 또는 업데이트
    static async setBalance(userId, amount) {
        let conn;
        try {
            conn = await pool.getConnection();
            // MariaDB UPSERT
            const result = await conn.query(
                `INSERT INTO initial_balance (user_id, amount, updated_at)
                 VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP`,
                [userId, amount]
            );
            return { id: typeof result.insertId === 'bigint' ? result.insertId.toString() : result.insertId, user_id: userId, amount };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 사용자의 총 잔액 계산 (초기 자본금 + 모든 거래)
    static async calculateTotalBalance(userId) {
        let conn;
        try {
            conn = await pool.getConnection();
            const query = `
                SELECT 
                    COALESCE(ib.amount, 0) as initial_balance,
                    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
                FROM users u
                LEFT JOIN initial_balance ib ON u.id = ib.user_id
                LEFT JOIN transactions t ON u.id = t.user_id
                WHERE u.id = ?
                GROUP BY u.id, ib.amount
            `;
            const rows = await conn.query(query, [userId]);
            const row = rows[0] || {};
            for (const key in row) {
                if (typeof row[key] === 'bigint') row[key] = row[key].toString();
            }
            const initialBalance = row.initial_balance || 0;
            const totalIncome = row.total_income || 0;
            const totalExpense = row.total_expense || 0;
            const currentBalance = initialBalance + totalIncome - totalExpense;
            return {
                initial_balance: initialBalance,
                total_income: totalIncome,
                total_expense: totalExpense,
                current_balance: currentBalance
            };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = InitialBalance; 