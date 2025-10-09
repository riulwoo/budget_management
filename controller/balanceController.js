const Asset = require('../model/Asset');
const { pool, getUtf8Connection } = require('../config/database');

class BalanceController {

    // 총 잔액 조회 (자산 기반)
    static async getTotalBalance(req, res) {
        let conn;
        try {
            const userId = req.user.id;
            conn = await getUtf8Connection();
            
            // 새로운 자산 기반 계산
            const query = `
                SELECT 
                    COALESCE(SUM(a.amount), 0) as initial_balance,
                    COALESCE(income.total, 0) as total_income,
                    COALESCE(expense.total, 0) as total_expense,
                    COALESCE(SUM(a.amount), 0) + COALESCE(income.total, 0) - COALESCE(expense.total, 0) as current_balance
                FROM users u
                LEFT JOIN assets a ON u.id = a.user_id AND a.is_active = TRUE
                LEFT JOIN (
                    SELECT user_id, SUM(amount) as total
                    FROM transactions 
                    WHERE type = 'income'
                    GROUP BY user_id
                ) income ON u.id = income.user_id
                LEFT JOIN (
                    SELECT user_id, SUM(amount) as total
                    FROM transactions 
                    WHERE type = 'expense'
                    GROUP BY user_id
                ) expense ON u.id = expense.user_id
                WHERE u.id = ?
                GROUP BY u.id
            `;
            
            const results = await conn.query(query, [userId]);
            let balance = results[0] || {
                initial_balance: 0,
                total_income: 0,
                total_expense: 0,
                current_balance: 0
            };
            
            // BigInt -> String 변환
            for (const key in balance) {
                if (typeof balance[key] === 'bigint') {
                    balance[key] = balance[key].toString();
                }
            }
            res.json({ success: true, data: balance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = BalanceController; 