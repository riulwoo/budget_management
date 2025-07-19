const db = require('../config/database');

class InitialBalance {
    // 사용자의 초기 자본금 조회
    static getByUserId(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM initial_balance WHERE user_id = ?', [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 초기 자본금 설정 또는 업데이트
    static setBalance(userId, amount) {
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO initial_balance (user_id, amount, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET 
                amount = ?, updated_at = CURRENT_TIMESTAMP
            `, [userId, amount, amount], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, user_id: userId, amount });
                }
            });
        });
    }

    // 사용자의 총 잔액 계산 (초기 자본금 + 모든 거래)
    static calculateTotalBalance(userId) {
        return new Promise((resolve, reject) => {
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
            
            db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    const initialBalance = row ? row.initial_balance : 0;
                    const totalIncome = row ? row.total_income : 0;
                    const totalExpense = row ? row.total_expense : 0;
                    const currentBalance = initialBalance + totalIncome - totalExpense;
                    
                    resolve({
                        initial_balance: initialBalance,
                        total_income: totalIncome,
                        total_expense: totalExpense,
                        current_balance: currentBalance
                    });
                }
            });
        });
    }
}

module.exports = InitialBalance; 