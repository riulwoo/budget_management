const InitialBalance = require('../model/InitialBalance');

class BalanceController {
    // 초기 자본금 조회
    static async getInitialBalance(req, res) {
        try {
            const userId = req.user.id;
            const balance = await InitialBalance.getByUserId(userId);
            res.json({ 
                success: true, 
                data: balance || { amount: 0 } 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 초기 자본금 설정
    static async setInitialBalance(req, res) {
        try {
            const userId = req.user.id;
            const { amount } = req.body;
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({ 
                    success: false, 
                    message: '금액을 입력해주세요.' 
                });
            }

            if (isNaN(amount) || amount < 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: '유효한 금액을 입력해주세요.' 
                });
            }

            const balance = await InitialBalance.setBalance(userId, parseFloat(amount));
            res.json({ success: true, data: balance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 총 잔액 조회 (초기 자본금 + 모든 거래)
    static async getTotalBalance(req, res) {
        try {
            const userId = req.user.id;
            const balance = await InitialBalance.calculateTotalBalance(userId);
            res.json({ success: true, data: balance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = BalanceController; 